package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.MyTodoListApplication;
import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Sprint;

import org.jdbi.v3.core.Handle; // Import Handle
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// Consider making this a Spring @Component or @Service
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// Consider adding @Component or @Service here and injecting Jdbi via constructor
public class BotController extends TelegramLongPollingBot {

	private static final Logger logger = LoggerFactory.getLogger(BotController.class); // Use BotController logger

	// Store the Jdbi instance, not individual repositories or a long-lived handle
	private final Jdbi jdbi;

	// Identifiers for callback data
	private static final String LOGIN_USER_PREFIX = "login_";
	private static final String TASK_PREFIX = "task_";
	private static final String SHOW_COMMENTS = "showComments";
	private static final String ADD_COMMENT = "addComment";
	private static final String ADD_TASK_TITLE = "addTaskTitle";
	private static final String ADD_TASK_DESCRIPTION = "addTaskDescription";
	private static final String ADD_TASK_ESTIMATED_HOURS = "addTaskEstimatedHours";
	private static final String ADD_TASL_SPRINT = "addTaskSprint"; // Typo? Should be ADD_TASK_SPRINT?
	private static final String SPRINT_SELECT_PREFIX = "sprint_select_";
	private static final String NO_SPRINT_OPTION = "no_sprint";
	private static final String STATUS_SELECT_PREFIX = "status_select_";
	private static final String CHANGE_STATUS = "change_status";
	private static final String TAG_SELECT_PREFIX = "tag_select_";
	private static final String FEATURE = "Feature";
	private static final String ISSUE = "Issue";
	private static final String CHANGE_REAL_HOURS = "real_hours";

	// User state management remains in memory
	private Map<Long, UserState> userStates = new ConcurrentHashMap<>();

	private String botUsername;
	// botToken is inherited from TelegramLongPollingBot

	public BotController(
			String botToken,
			String botUsername,
			Jdbi jdbi // Inject Jdbi instance
	) {
		super(botToken);
		this.botUsername = botUsername;
		this.jdbi = jdbi; // Store the Jdbi instance

		// DO NOT open a handle or attach repositories here.
		// Handles should be short-lived and obtained within methods.

		logger.info("BotController initialized for bot username: {}", botUsername);
	}

	// --- Jdbi Corrected Methods ---

	private UserState findUserOrNewState(long chatId) {
		// Use withHandle to get a short-lived handle and return the UserState
		return jdbi.withHandle(handle -> {
			UserRepository userRepo = handle.attach(UserRepository.class);
			UserState new_US = new UserState();
			Optional<User> userOpt = userRepo.findByChatId(chatId);
			if (userOpt.isPresent()) {
				new_US.loggedInUserId = userOpt.get().getId();
				new_US.userName = userOpt.get().getName();
				logger.debug("Found existing user {} for chat {}", new_US.userName, chatId);
			} else {
				logger.debug("No existing user found for chat {}", chatId);
			}
			return new_US;
		});
	}

	private void showUserList(long chatId) {
		jdbi.useHandle(handle -> { // Use useHandle as we don't return a value
			UserRepository userRepo = handle.attach(UserRepository.class);
			List<User> allUsers = userRepo.findAll(100000, 0); // Consider pagination if list grows large
			if (allUsers.isEmpty()) {
				sendTelegramMessage(chatId, "No hay usuarios registrados.");
				return; // Exit the lambda
			}

			InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
			List<List<InlineKeyboardButton>> rows = new ArrayList<>();

			for (User user : allUsers) {
				InlineKeyboardButton btn = createButton(
						user.getName() + " (" + user.getEmail() + ")",
						LOGIN_USER_PREFIX + user.getId());
				rows.add(Collections.singletonList(btn));
			}
			markup.setKeyboard(rows);

			sendTelegramMessage(chatId, "Selecciona tu usuario:", markup);
		});
	}

	private void listTasksForUser(long chatId, Long userId) {
		List<Task> tasks = taskRepository.findTasksAssignedToUser(userId);
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();
		if (tasks.isEmpty()) {
			rows.add(Collections.singletonList(createButton("Agregar tarea", ADD_TASK_TITLE)));
			markup.setKeyboard(rows);
			sendTelegramMessage(chatId, "No tienes tareas asignadas.");
			sendTelegramMessage(chatId, "Agrega una tarea!",markup);
		}else{
			for (Task task : tasks) {
				InlineKeyboardButton btn = createButton(
						task.getTitle() + " [ID: " + task.getId() + "]",
						TASK_PREFIX + task.getId());
				rows.add(Collections.singletonList(btn));
				}
				rows.add(Collections.singletonList(createButton("Agregar tarea", ADD_TASK_TITLE)));
				markup.setKeyboard(rows);
				sendTelegramMessage(chatId, "Estas son tus tareas asignadas:", markup);	
			}
	}

	private void showTaskDetails(long chatId, Long taskId) {
		jdbi.useHandle(handle -> {
			TaskRepository taskRepo = handle.attach(TaskRepository.class);
			SprintRepository sprintRepo = handle.attach(SprintRepository.class); // Need Sprint repo too

			Optional<Task> optTask = taskRepo.findById(taskId);
			if (optTask.isEmpty()) {
				sendTelegramMessage(chatId, "Tarea no encontrada con ID: " + taskId);
				return;
			}

			Task task = optTask.get();
			String sprintName = "Sin sprint";
			if (task.getSprintId() != null) {
				// Fetch sprint name safely
				sprintName = sprintRepo.findById(task.getSprintId())
						.map(Sprint::getName)
						.orElse("Sprint ID " + task.getSprintId() + " no encontrado");
			}

			String messageText = String.format(
					"Tarea: %s\nDescripción: %s\nTag: %s\nSprint: %s\nEstado: %s\nInicio: %s\nFin: %s\nHoras Estimadas: %s\nHoras Reales: %s\n",
					task.getTitle(),
					task.getDescription(),
					task.getTag() != null ? task.getTag() : "--", // Handle null tag
					sprintName,
					task.getStatus(),
					task.getStartDate() != null ? task.getStartDate() : "--", // Handle null dates
					task.getEndDate() != null ? task.getEndDate() : "--",
					(task.getEstimatedHours() != null) ? task.getEstimatedHours() : "--",
					(task.getActualHours() != null) ? task.getActualHours() : "--");

			InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
			List<List<InlineKeyboardButton>> rows = new ArrayList<>();

			rows.add(Collections.singletonList(createButton("Ver comentarios", SHOW_COMMENTS)));
			rows.add(Collections.singletonList(createButton("Agregar comentario", ADD_COMMENT)));
			rows.add(Collections.singletonList(createButton("Cambiar estatus", CHANGE_STATUS)));
			rows.add(Collections.singletonList(createButton("Colocar horas reales", CHANGE_REAL_HOURS)));

			markup.setKeyboard(rows);
			sendTelegramMessage(chatId, messageText, markup);
		});
	}

	private void showComments(long chatId, Long taskId) {
		if (taskId == null) {
			sendTelegramMessage(chatId, "No has seleccionado ninguna tarea.");
			return;
		}

		jdbi.useHandle(handle -> {
			CommentRepository commentRepo = handle.attach(CommentRepository.class);
			List<Comment> comments = commentRepo.findByTaskId(taskId);
			if (comments.isEmpty()) {
				sendTelegramMessage(chatId, "No hay comentarios para esta tarea.");
				return;
			}

			StringBuilder sb = new StringBuilder("Comentarios:\n");
			for (Comment c : comments) {
				sb.append(String.format(
						"- %s dice: %s\n",
						(c.getCreatorName() != null ? c.getCreatorName() : "Desconocido"),
						c.getContent()));
			}
			sendTelegramMessage(chatId, sb.toString());
		});
	}

	private void addNewComment(long chatId, Long taskId, Long userId, String content) {
		if (taskId == null || userId == null) {
			sendTelegramMessage(chatId, "No se puede crear comentario: Falta tarea o usuario.");
			return;
		}

		jdbi.useHandle(handle -> {
			UserRepository userRepo = handle.attach(UserRepository.class);
			CommentRepository commentRepo = handle.attach(CommentRepository.class);

			// Fetch user (to get userName) – handle optional carefully
			String authorName = userRepo.findById(userId)
					.map(User::getName)
					.orElse("Usuario ID " + userId); // Provide fallback

			Comment comment = new Comment();
			comment.setTaskId(taskId);
			comment.setContent(content);
			comment.setCreatorId(userId);
			comment.setCreatorName(authorName); // Use fetched or fallback name
			comment.setCreatedAt(new Date());

			commentRepo.insert(comment);

			sendTelegramMessage(chatId, "Comentario agregado correctamente.");
		});
	}

	private void createNewTask(Long chatId, UserState state) {
		// Use withHandle because we need the returned taskId
		Long taskId = jdbi.withHandle(handle -> {
			UserRepository userRepo = handle.attach(UserRepository.class);
			TaskRepository taskRepo = handle.attach(TaskRepository.class);

			state.NewTask.setCreatorId(state.loggedInUserId);
			state.NewTask.setStartDate(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
			state.NewTask.setActualHours(null); // Explicitly null
			state.NewTask.setEndDate(null); // Explicitly null
			state.NewTask.setStatus(TaskStatus.BACKLOG.getDisplayName());

			// Fetch current user details
			Optional<User> currentUserOpt = userRepo.findById(state.loggedInUserId);
			if (currentUserOpt.isEmpty()) {
				logger.error("Cannot create task: logged in user ID {} not found in DB.", state.loggedInUserId);
				sendTelegramMessage(chatId, "Error: No se pudo encontrar tu usuario para crear la tarea.");
				return null; // Indicate failure
			}
			User currentUser = currentUserOpt.get();
			state.NewTask.setCreatorName(currentUser.getName());
			if (currentUser.getTeamId() != null) {
				state.NewTask.setTeamId(currentUser.getTeamId());
			} else {
				logger.warn("User {} has no team ID, task {} will not have a team ID.", currentUser.getName(),
						state.NewTask.getTitle());
				state.NewTask.setTeamId(null); // Explicitly null if user has no team
			}

			// Insert the task
			Long newTaskId = taskRepo.insert(state.NewTask);

			// Add assignee only if task insertion was successful
			if (newTaskId != null) {
				taskRepo.addAssignee(newTaskId, state.loggedInUserId);
				logger.info("Task {} created with ID {} and assigned to user {}", state.NewTask.getTitle(), newTaskId,
						state.loggedInUserId);
			} else {
				logger.error("Task insertion failed for task title: {}", state.NewTask.getTitle());
			}
			return newTaskId; // Return the ID (or null if failed)
		});

		// Process result outside the handle block
		if (taskId != null) {
			sendTelegramMessage(chatId, "¡Tarea creada correctamente con ID: " + taskId + "!");
			state.selectedTaskId = taskId; // Update state
			state.currentAction = "NORMAL";
			listTasksForUser(chatId, state.loggedInUserId); // Show updated list
		} else {
			sendTelegramMessage(chatId, "Error al crear la tarea. Por favor, intenta nuevamente.");
			state.currentAction = "NORMAL"; // Reset state even on failure
			// Optionally show the task list again or offer to retry
			listTasksForUser(chatId, state.loggedInUserId);
		}
	}

	// eraseTask was not used in the chat history, but fixed for completeness
	private void eraseTask(long chatId, Long taskId, Long userId) { // Added userId for context
		if (taskId == null) {
			sendTelegramMessage(chatId, "No se puede eliminar la tarea: ID no válido.");
			return;
		}
		jdbi.useHandle(handle -> {
			TaskRepository taskRepo = handle.attach(TaskRepository.class);
			// Optional: Add checks here - does the task exist? Does the user have
			// permission?
			int deletedRows = taskRepo.delete(taskId); // Assuming delete returns number of rows affected
			if (deletedRows > 0) {
				sendTelegramMessage(chatId, "Tarea eliminada correctamente.");
				logger.info("Task {} deleted by user {}", taskId, userId);
			} else {
				sendTelegramMessage(chatId, "No se pudo eliminar la tarea (quizás ya no existía).");
				logger.warn("Attempted to delete non-existent task {} by user {}", taskId, userId);
			}
		});
		// Refresh task list after deletion attempt
		listTasksForUser(chatId, userId);
	}

	private void showSprintsForTeam(long chatId, Long teamId) {
		jdbi.useHandle(handle -> {
			SprintRepository sprintRepo = handle.attach(SprintRepository.class);
			List<Sprint> sprints = sprintRepo.findByTeamId(teamId);

			InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
			List<List<InlineKeyboardButton>> rows = new ArrayList<>();

			if (sprints.isEmpty()) {
				sendTelegramMessage(chatId,
						"No hay sprints disponibles para tu equipo. La tarea se creará sin asignar a un sprint.");
				UserState state = userStates.get(chatId); // Assuming state exists
				if (state != null && state.NewTask != null) {
					state.NewTask.setSprintId(null);
					// Proceed to create task directly from here
					createNewTask(chatId, state);
				} else {
					logger.error("State or NewTask is null when trying to create task without sprint for chat {}",
							chatId);
					sendTelegramMessage(chatId, "Error interno al procesar la creación de la tarea.");
				}
				return; // Exit lambda
			}

			for (Sprint sprint : sprints) {
				InlineKeyboardButton btn = createButton(
						sprint.getName(),
						SPRINT_SELECT_PREFIX + sprint.getId());
				rows.add(Collections.singletonList(btn));
			}

			InlineKeyboardButton noSprintBtn = createButton("Sin sprint", SPRINT_SELECT_PREFIX + NO_SPRINT_OPTION);
			rows.add(Collections.singletonList(noSprintBtn));

			markup.setKeyboard(rows);
			sendTelegramMessage(chatId, "Selecciona el sprint para esta tarea:", markup);
		});
	}

	// --- End of Jdbi Corrected Methods ---

	// Enum definition remains the same
	public enum TaskStatus {
		BACKLOG("Backlog"),
		IN_PROGRESS("En progreso"),
		COMPLETED("Completada"),
		CANCELLED("Cancelada");

		private final String displayName;

		TaskStatus(String displayName) {
			this.displayName = displayName;
		}

		public String getDisplayName() {
			return displayName;
		}

		@Override
		public String toString() {
			return displayName;
		}

		public static TaskStatus fromString(String text) {
			for (TaskStatus status : TaskStatus.values()) {
				if (status.displayName.equalsIgnoreCase(text)) {
					return status;
				}
			}
			// Consider throwing an exception or logging a warning for invalid input
			logger.warn("Invalid status string received: '{}', defaulting to BACKLOG", text);
			return BACKLOG;
		}

		// Added valueOfDisplayName for safer lookup
		public static Optional<TaskStatus> valueOfDisplayName(String displayName) {
			return Arrays.stream(values())
					.filter(status -> status.displayName.equalsIgnoreCase(displayName))
					.findFirst();
		}
	}

	@Override
	public void onUpdateReceived(Update update) {
		long chatId = 0;
		String text = null;
		String callbackData = null;
		boolean isCallback = update.hasCallbackQuery();
		boolean isMessage = update.hasMessage() && update.getMessage().hasText();

		try { // Wrap main logic in try-catch for unexpected errors

			if (isCallback) {
				chatId = update.getCallbackQuery().getMessage().getChatId();
				callbackData = update.getCallbackQuery().getData();
				logger.debug("Handling callback query from Tel_ID {}: {}", chatId, callbackData);
			} else if (isMessage) {
				chatId = update.getMessage().getChatId();
				text = update.getMessage().getText();
				logger.debug("Handling message from Tel_ID {}: {}", chatId, text);
			} else {
				// Ignore updates without messages or callbacks
				return;
			}

			// --- State Management ---
			// Crucially, findUserOrNewState now uses a proper Jdbi handle
			final long finalChatId = chatId; // Need final variable for lambda
			UserState state = userStates.computeIfAbsent(chatId, k -> findUserOrNewState(finalChatId));
			// Ensure state is never null after computeIfAbsent
			if (state == null) {
				logger.error("UserState became null after computeIfAbsent for chat ID: {}", chatId);
				// Attempt recovery or send error message
				final UserState finalState = findUserOrNewState(chatId); // Try again
				if (finalState == null) {
					sendTelegramMessage(chatId,
							"Error interno del bot (estado de usuario). Por favor, intente de nuevo más tarde.");
					return; // Cannot proceed without state
				}
				userStates.put(chatId, state); // Put it back if recovered
			}

			// --- Message Handling ---
			if (isMessage) {
				logger.debug("Processing text '{}' in context {}", text, state);

				if ("/login".equalsIgnoreCase(text)) {
					showUserList(chatId);
				} else if ("/logout".equalsIgnoreCase(text)) {
					final UserState finalState = state; // Final variable for lambda
					jdbi.useHandle(handle -> { // Use handle for DB operation
						UserRepository userRepo = handle.attach(UserRepository.class);
						int updatedRows = userRepo.forgetChatId(finalChatId); // Use finalChatId
						logger.info("Attempted to clear chatId {} from DB, rows affected: {}", finalChatId,
								updatedRows);
					});
					// Reset in-memory state regardless of DB success
					sendTelegramMessage(chatId, "Terminando sesión como " + state.userName);
					state.reset(); // Reset memory state
				} else if ("/start".equalsIgnoreCase(text) || "/tasks".equalsIgnoreCase(text)) {
					if (state.loggedInUserId == null) {
						sendTelegramMessage(chatId, "No hay sesión iniciada. Por favor, usa /login.");
						showUserList(chatId); // Prompt login
					} else {
						// Use state.userName which was loaded by findUserOrNewState
						sendTelegramMessage(chatId, "Sesión iniciada como " + state.userName
								+ " automáticamente. Usa '/logout' para ingresar como otro usuario.");
						listTasksForUser(chatId, state.loggedInUserId);
					}
				} else if ("/whoami".equalsIgnoreCase(text)) {
					if (state.loggedInUserId == null || state.userName == null) {
						sendTelegramMessage(chatId, "No has iniciado sesión. Usa /login.");
					} else {
						sendTelegramMessage(chatId, "Sesión de " + state.userName);
					}
				} else if ("/cancel".equalsIgnoreCase(text)) {
					boolean wasInProgress = !"NORMAL".equals(state.currentAction);
					state.softReset(); // Reset action, selected task, new task buffer
					sendTelegramMessage(chatId, "Acción cancelada.");
					if (wasInProgress && state.loggedInUserId != null) {
						// If something was cancelled, show task list for context
						listTasksForUser(chatId, state.loggedInUserId);
					}
				}
				// --- State-dependent Text Input Handling ---
				else {
					switch (state.currentAction) {
						case "ADDING_COMMENT":
							if (state.selectedTaskId == null) {
								sendTelegramMessage(chatId,
										"Error: No hay tarea seleccionada para añadir comentario. Usa /cancel.");
							} else {
								addNewComment(chatId, state.selectedTaskId, state.loggedInUserId, text);
								state.currentAction = "NORMAL"; // Reset state after successful add
								// Optionally show comments again or task details
								showTaskDetails(chatId, state.selectedTaskId);
							}
							break;
						case "ADDING_TASK_TITLE":
							state.NewTask = new Task(); // Ensure NewTask is initialized
							state.NewTask.setTitle(text);
							state.currentAction = "ADDING_TASK_DESCRIPTION";
							sendTelegramMessage(chatId, "Por favor, escribe la descripción de la tarea:");
							sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
							break;
						case "ADDING_TASK_DESCRIPTION":
							if (state.NewTask == null) { // Safety check
								sendTelegramMessage(chatId, "Error: No se encontró la tarea en progreso. Usa /cancel.");
								state.softReset();
								break;
							}
							state.NewTask.setDescription(text);
							state.currentAction = "ADDING_TASK_ESTIMATED_HOURS";
							sendTelegramMessage(chatId, "Por favor, escribe las horas estimadas de la tarea (número):");
							break;
						case "ADDING_TASK_ESTIMATED_HOURS":
							if (state.NewTask == null) { // Safety check
								sendTelegramMessage(chatId, "Error: No se encontró la tarea en progreso. Usa /cancel.");
								state.softReset();
								break;
							}
							try {
								state.NewTask.setEstimatedHours(Double.parseDouble(text));
								// Proceed to next step only if parsing succeeds
								showTagOptions(chatId); // Ask for tag next
								// state.currentAction will be set by showTagOptions or subsequent callbacks
							} catch (NumberFormatException e) {
								logger.warn("Invalid number format for estimated hours from chat {}: {}", chatId, text);
								sendTelegramMessage(chatId,
										"Formato inválido. Por favor, escribe un número para las horas estimadas (ej: 2.5):");
								// Keep state as ADDING_TASK_ESTIMATED_HOURS to re-prompt
							}
							break;
						case "ADDING_TASK_REAL_TIME":
							if (state.selectedTaskId == null) {
								sendTelegramMessage(chatId,
										"Error: No hay tarea seleccionada para añadir horas reales. Usa /cancel.");
								state.softReset();
								break;
							}
							try {
								double realHours = Double.parseDouble(text);
								final Long finalSelectedTaskId = state.selectedTaskId; // Final for lambda
								jdbi.useHandle(handle -> { // Use handle for DB update
									TaskRepository taskRepo = handle.attach(TaskRepository.class);
									taskRepo.updateRealHours(finalSelectedTaskId, realHours);
								});
								sendTelegramMessage(chatId, "Horas reales actualizadas.");
								state.softReset(); // Reset state
								listTasksForUser(chatId, state.loggedInUserId); // Show updated list
							} catch (NumberFormatException e) {
								logger.warn("Invalid number format for real hours from chat {}: {}", chatId, text);
								sendTelegramMessage(chatId,
										"Formato inválido. Por favor, escribe un número para las horas reales (ej: 3):");
								// Keep state as ADDING_TASK_REAL_TIME to re-prompt
							}
							break;
						default: // Includes "NORMAL" state or any unexpected state
							sendTelegramMessage(chatId,
									"Comando no reconocido o acción inesperada. Usa /tasks para ver tus tareas o /cancel para anular.");
							logger.warn("Unrecognized command or unexpected state '{}' for chat {}: {}",
									state.currentAction, chatId, text);
							// Optionally reset state here if it seems stuck
							// state.softReset();
							break;
					}
				}
			}

			// --- Callback Handling ---
			else if (isCallback) {
				logger.debug("Processing callback '{}' in context {}", callbackData, state);

				// Check if user is logged in for most callbacks
				if (state.loggedInUserId == null && !callbackData.startsWith(LOGIN_USER_PREFIX)) {
					logger.debug("Chat {} received callback '{}' but is not logged in.", chatId, callbackData);
					sendTelegramMessage(chatId,
							"No has iniciado sesión actualmente. Inicia sesión con '/login' para continuar.");
					// Optionally show login prompt again
					// showUserList(chatId);
					return; // Stop processing callback if not logged in (except for login itself)
				}

				// --- Callback Routing ---
				if (callbackData.startsWith(LOGIN_USER_PREFIX)) {
					try {
						String userIdString = callbackData.substring(LOGIN_USER_PREFIX.length());
						Long userId = Long.parseLong(userIdString);
						final UserState finalState = state; // Final for lambda
						final long finalChatIdForLogin = chatId; // Final for lambda

						// Use withHandle as we need the user details
						Optional<User> userOpt = jdbi.withHandle(handle -> {
							UserRepository userRepo = handle.attach(UserRepository.class);
							// Clear any previous association for this chat ID first
							userRepo.forgetChatId(finalChatIdForLogin);
							// Set the new association
							userRepo.setChatIdForUser(userId, finalChatIdForLogin);
							// Return the user details
							return userRepo.findById(userId);
						});

						if (userOpt.isPresent()) {
							User user = userOpt.get();
							state.loggedInUserId = userId;
							state.userName = user.getName();
							state.currentAction = "NORMAL"; // Ensure state is normal after login
							sendTelegramMessage(chatId, "Has iniciado sesión como usuario: " + user.getName());
							sendTelegramMessage(chatId, "Puedes cerrar sesión con '/logout' en cualquier momento");
							listTasksForUser(chatId, userId);
						} else {
							logger.error("Login failed: User ID {} not found after callback.", userId);
							sendTelegramMessage(chatId, "Error al iniciar sesión: Usuario no encontrado.");
							state.reset(); // Reset state if login failed
						}
					} catch (NumberFormatException e) {
						logger.error("Invalid user ID format in login callback: {}", callbackData, e);
						sendTelegramMessage(chatId, "Error interno (formato de ID de usuario inválido).");
					}
				} else if (callbackData.startsWith(TASK_PREFIX)) {
					try {
						String taskIdString = callbackData.substring(TASK_PREFIX.length());
						Long taskId = Long.parseLong(taskIdString);
						state.selectedTaskId = taskId;
						state.currentAction = "NORMAL"; // Viewing task details is a normal state
						showTaskDetails(chatId, taskId);
					} catch (NumberFormatException e) {
						logger.error("Invalid task ID format in task callback: {}", callbackData, e);
						sendTelegramMessage(chatId, "Error interno (formato de ID de tarea inválido).");
					}
				} else if (SHOW_COMMENTS.equals(callbackData)) {
					if (state.selectedTaskId == null) {
						sendTelegramMessage(chatId, "Por favor, selecciona una tarea primero.");
					} else {
						showComments(chatId, state.selectedTaskId);
						// Optionally show task details again after comments
						showTaskDetails(chatId, state.selectedTaskId);
					}
				} else if (ADD_COMMENT.equals(callbackData)) {
					if (state.selectedTaskId == null) {
						sendTelegramMessage(chatId, "Por favor, selecciona una tarea primero.");
					} else {
						state.currentAction = "ADDING_COMMENT";
						sendTelegramMessage(chatId, "Por favor, escribe tu comentario ahora:");
						sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
					}
				} else if (ADD_TASK_TITLE.equals(callbackData)) {
					state.currentAction = "ADDING_TASK_TITLE";
					state.NewTask = new Task(); // Initialize here
					sendTelegramMessage(chatId, "Por favor, escribe el título de la tarea:");
					sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
				} else if (callbackData.startsWith(SPRINT_SELECT_PREFIX)) {
					if (state.NewTask == null || !"ADDING_TASK_SPRINT".equals(state.currentAction)) {
						sendTelegramMessage(chatId, "Acción inesperada. Usa /cancel para reiniciar.");
						logger.warn("Received SPRINT_SELECT callback in unexpected state {} for chat {}",
								state.currentAction, chatId);
						state.softReset();
						return;
					}
					String sprintIdStr = callbackData.substring(SPRINT_SELECT_PREFIX.length());
					try {
						if (NO_SPRINT_OPTION.equals(sprintIdStr)) {
							state.NewTask.setSprintId(null);
						} else {
							Long sprintId = Long.parseLong(sprintIdStr);
							// Optional: Validate sprintId exists for the team using jdbi.withHandle
							state.NewTask.setSprintId(sprintId);
						}
						// Proceed to create the task
						sendTelegramMessage(chatId, "Procesando la creación de la tarea...");
						createNewTask(chatId, state); // createNewTask now handles state reset
					} catch (NumberFormatException e) {
						logger.error("Invalid sprint ID format in sprint select callback: {}", callbackData, e);
						sendTelegramMessage(chatId, "Error interno (formato de ID de sprint inválido).");
					}
				} else if (CHANGE_STATUS.equals(callbackData)) {
					if (state.selectedTaskId == null) {
						sendTelegramMessage(chatId, "Por favor, selecciona una tarea primero.");
					} else {
						sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
						showStatusOptions(chatId, state.selectedTaskId);
						// state.currentAction remains NORMAL while selecting status
					}
				} else if (callbackData.startsWith(STATUS_SELECT_PREFIX)) {
					if (state.selectedTaskId == null) {
						sendTelegramMessage(chatId,
								"Error: No hay tarea seleccionada para cambiar estado. Usa /cancel.");
						state.softReset();
						return;
					}
					String statusName = callbackData.substring(STATUS_SELECT_PREFIX.length());
					try {
						TaskStatus selectedStatus = TaskStatus.valueOf(statusName); // Use enum valueOf
						final Long finalSelectedTaskId = state.selectedTaskId; // Final for lambda

						jdbi.useHandle(handle -> { // Use handle for DB updates
							TaskRepository taskRepo = handle.attach(TaskRepository.class);
							String endDate = null;
							if (selectedStatus == TaskStatus.COMPLETED) {
								endDate = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
								taskRepo.updateEndDate(finalSelectedTaskId, endDate);
							}
							// Update status regardless of end date change
							taskRepo.updateStatus(finalSelectedTaskId, selectedStatus.getDisplayName());
						});

						sendTelegramMessage(chatId, "Estado actualizado a: " + selectedStatus.getDisplayName());
						if (selectedStatus == TaskStatus.COMPLETED) {
							sendTelegramMessage(chatId, "Fecha Final declarada como "
									+ new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
						}

						state.currentAction = "NORMAL"; // Back to normal state
						listTasksForUser(chatId, state.loggedInUserId); // Show updated list

					} catch (IllegalArgumentException e) {
						logger.error("Invalid status name in status select callback: {}", callbackData, e);
						sendTelegramMessage(chatId, "Error interno (nombre de estado inválido).");
					}
				} else if (callbackData.startsWith(TAG_SELECT_PREFIX)) {
					if (state.NewTask == null || !state.currentAction.startsWith("ADDING_TASK")) {
						sendTelegramMessage(chatId, "Acción inesperada. Usa /cancel para reiniciar.");
						logger.warn("Received TAG_SELECT callback in unexpected state {} for chat {}",
								state.currentAction, chatId);
						state.softReset();
						return;
					}
					String tag = callbackData.substring(TAG_SELECT_PREFIX.length());
					if (FEATURE.equals(tag) || ISSUE.equals(tag)) {
						state.NewTask.setTag(tag);
						state.currentAction = "ADDING_TASK_SPRINT"; // Set state for next step
						sendTelegramMessage(chatId, "Por favor, selecciona el sprint para la tarea:");
						sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");

						// Fetch user's team ID using a handle
						Long teamId = jdbi.withHandle(handle -> {
							UserRepository userRepo = handle.attach(UserRepository.class);
							return userRepo.findById(state.loggedInUserId)
									.map(User::getTeamId) // Map to teamId
									.orElse(null); // Return null if user or teamId not found
						});

						if (teamId != null) {
							showSprintsForTeam(chatId, teamId);
						} else {
							logger.warn("Could not determine team ID for user {} (ID: {}). Task will have no sprint.",
									state.userName, state.loggedInUserId);
							sendTelegramMessage(chatId,
									"No se pudo determinar tu equipo. No se asignará ningún sprint.");
							state.NewTask.setSprintId(null);
							createNewTask(chatId, state); // Create task without sprint
						}
					} else {
						logger.warn("Invalid tag received in callback for chat {}: {}", chatId, callbackData);
						sendTelegramMessage(chatId, "Tag inválido seleccionado.");
						// Re-show tag options? Or cancel?
						showTagOptions(chatId);
					}
				} else if (CHANGE_REAL_HOURS.equals(callbackData)) {
					if (state.selectedTaskId == null) {
						sendTelegramMessage(chatId, "Por favor, selecciona una tarea primero.");
					} else {
						state.currentAction = "ADDING_TASK_REAL_TIME";
						sendTelegramMessage(chatId, "Por favor, escribe las horas reales de la tarea (número):");
						sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
					}
				} else {
					sendTelegramMessage(chatId, "Acción no reconocida.");
					logger.warn("Unrecognized callback data received for chat {}: {}", chatId, callbackData);
				}
			}

		} catch (Exception e) {
			// Catch unexpected errors during update processing
			logger.error("Unhandled exception during onUpdateReceived for chat {}: {}", chatId, e.getMessage(), e);
			if (chatId != 0) { // Send error message if we know the chat ID
				sendTelegramMessage(chatId,
						"Ocurrió un error inesperado procesando tu solicitud. Por favor, intenta de nuevo más tarde o usa /cancel.");
			}
			// Optionally try to reset state for the user if an error occurred
			if (chatId != 0) {
				UserState errorState = userStates.get(chatId);
				if (errorState != null) {
					errorState.softReset(); // Attempt to reset state to NORMAL
				}
			}
		}
	}

	@Override
	public String getBotUsername() {
		return this.botUsername;
	}

	// getBotToken() is inherited and uses the token passed to the constructor

	private void showTagOptions(long chatId) {
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();

		InlineKeyboardButton featureBtn = createButton(FEATURE, TAG_SELECT_PREFIX + FEATURE);
		InlineKeyboardButton issueBtn = createButton(ISSUE, TAG_SELECT_PREFIX + ISSUE);

		rows.add(Collections.singletonList(featureBtn));
		rows.add(Collections.singletonList(issueBtn));

		markup.setKeyboard(rows);
		sendTelegramMessage(chatId, "Selecciona el tag para la tarea:", markup);
		// State remains ADDING_TASK_ESTIMATED_HOURS until tag is selected,
		// then callback handler sets it to ADDING_TASK_SPRINT
	}

	private void showStatusOptions(long chatId, long taskId) { // taskId passed for context, though not strictly needed
																// here
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();

		for (TaskStatus status : TaskStatus.values()) {
			InlineKeyboardButton button = createButton(
					status.getDisplayName(),
					STATUS_SELECT_PREFIX + status.name() // Use enum constant name for callback data
			);
			rows.add(Collections.singletonList(button));
		}

		markup.setKeyboard(rows);
		sendTelegramMessage(chatId, "Selecciona el nuevo estado para la tarea:", markup);
	}

	// Utility methods

	private InlineKeyboardButton createButton(String text, String callbackData) {
		InlineKeyboardButton button = new InlineKeyboardButton();
		button.setText(text);
		// Telegram callback data has a size limit (1-64 bytes)
		if (callbackData.length() > 64) {
			logger.warn("Callback data exceeds 64 bytes limit: {}", callbackData);
			// Handle this - maybe shorten data, use a different mechanism, or throw error
			// For now, let it potentially fail in Telegram API
		}
		button.setCallbackData(callbackData);
		return button;
	}

	private void sendTelegramMessage(long chatId, String text) {
		sendTelegramMessage(chatId, text, null);
	}

	private void sendTelegramMessage(long chatId, String text, InlineKeyboardMarkup markup) {
		SendMessage message = new SendMessage();
		message.setChatId(String.valueOf(chatId)); // Use String valueOf for chatId
		message.setText(text);
		if (markup != null) {
			message.setReplyMarkup(markup);
		}
		try {
			execute(message); // This method is provided by TelegramLongPollingBot
		} catch (TelegramApiException e) {
			// Log specific Telegram API errors
			logger.error("Telegram API error sending message to chat {}: {}", chatId, e.getMessage(), e);
			// Consider more specific error handling based on e.getErrorCode()
			// e.g., handle 403 Forbidden (bot blocked by user), 400 Bad Request (invalid
			// chat id?)
		} catch (Exception e) {
			// Catch other potential runtime exceptions during message sending
			logger.error("Unexpected error sending message to chat {}: {}", chatId, e.getMessage(), e);
		}
	}

	// UserState helper class remains the same
	private static class UserState {
		Long loggedInUserId;
		String userName;
		Long selectedTaskId;
		String currentAction = "NORMAL"; // Default state
		Task NewTask; // Buffer for task being created

		UserState() {
			reset();
		}

		void reset() {
			this.loggedInUserId = null;
			this.userName = null;
			softReset();
		}

		// Resets temporary action/selection state, keeps login info
		void softReset() {
			this.selectedTaskId = null;
			this.currentAction = "NORMAL";
			this.NewTask = null;
		}

		@Override
		public String toString() {
			return "UserState{" +
					"loggedInUserId=" + loggedInUserId +
					", userName='" + userName + '\'' +
					", selectedTaskId=" + selectedTaskId +
					", currentAction='" + currentAction + '\'' +
					", hasNewTask=" + (NewTask != null) +
					'}';
		}
	}
}
