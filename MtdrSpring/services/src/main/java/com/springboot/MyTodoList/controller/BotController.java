package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Bot controller that is created programmatically by TelegramBotService.
 * Not a Spring component, so it doesn't use Spring's autowiring.
 */
public class BotController extends TelegramLongPollingBot {

	private static final Logger logger = LoggerFactory.getLogger(BotController.class);

	private final Jdbi jdbi;

	private UserRepository userRepository;
	private TaskRepository taskRepository;
	private CommentRepository commentRepository;
	private SprintRepository sprintRepository;

	private final String botUsername;

	private final AuthenticationService autentication; 

	private static final String LOGIN_USER_PREFIX = "login_";
	private static final String TASK_PREFIX = "task_";
	private static final String SHOW_COMMENTS = "showComments";
	private static final String ADD_COMMENT = "addComment";
	private static final String ADD_TASK_TITLE = "addTaskTitle";
	private static final String SPRINT_SELECT_PREFIX = "sprint_select_";
	private static final String NO_SPRINT_OPTION = "no_sprint";
	private static final String STATUS_SELECT_PREFIX = "status_select_";
	private static final String CHANGE_STATUS = "change_status";
	private static final String TAG_SELECT_PREFIX = "tag_select_";
	private static final String FEATURE = "Feature";
	private static final String ISSUE = "Issue";
	private static final String CHANGE_REAL_HOURS = "real_hours";
	private static final String PUT_EMAIL = "put_email";
	private static final String PUT_PASS = "put_ pass";

	// TODO: Se usan?
	// private static final String ADD_TASK_DESCRIPTION = "addTaskDescription";
	// private static final String ADD_TASK_ESTIMATED_HOURS =
	// "addTaskEstimatedHours";
	// private static final String ADD_TASK_SPRINT = "addTaskSprint";

	private Map<Long, UserState> userStates = new ConcurrentHashMap<>();

	public BotController(String botToken, String botUsername, Jdbi jdbi, AuthenticationService autentication) {
		super(botToken);
		this.botUsername = botUsername;
		this.jdbi = jdbi;
		this.autentication = autentication;

		this.userRepository = jdbi.onDemand(UserRepository.class);
		this.taskRepository = jdbi.onDemand(TaskRepository.class);
		this.commentRepository = jdbi.onDemand(CommentRepository.class);
		this.sprintRepository = jdbi.onDemand(SprintRepository.class);

		logger.info("BotController initialized for bot username: {}", botUsername);
	}

	@Override
	public String getBotUsername() {
		return this.botUsername;
	}

	private static class TelegramUI {
		public static InlineKeyboardButton createButton(String text, String callbackData) {
			InlineKeyboardButton button = new InlineKeyboardButton();
			button.setText(text);

			if (callbackData.length() > 64) {
				LoggerFactory.getLogger(TelegramUI.class).warn("Callback data exceeds 64 bytes limit: {}",
						callbackData);
			}

			button.setCallbackData(callbackData);
			return button;
		}

		public static InlineKeyboardMarkup createSingleColumnKeyboard(List<ButtonData> buttons) {
			InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
			List<List<InlineKeyboardButton>> rows = new ArrayList<>();

			for (ButtonData buttonData : buttons) {
				rows.add(Collections.singletonList(createButton(buttonData.text, buttonData.callbackData)));
			}

			markup.setKeyboard(rows);
			return markup;
		}

		public static class ButtonData {
			final String text;
			final String callbackData;

			public ButtonData(String text, String callbackData) {
				this.text = text;
				this.callbackData = callbackData;
			}
		}
	}

	private void sendMessage(long chatId, String text) {
		sendMessage(chatId, text, null);
	}

	private void sendMessage(long chatId, String text, InlineKeyboardMarkup markup) {
		SendMessage message = new SendMessage();
		message.setChatId(String.valueOf(chatId));
		message.setText(text);

		if (markup != null) {
			message.setReplyMarkup(markup);
		}

		try {
			execute(message);
		} catch (TelegramApiException e) {
			logger.error("Telegram API error sending message to chat {}: {}", chatId, e.getMessage(), e);
		} catch (Exception e) {
			logger.error("Unexpected error sending message to chat {}: {}", chatId, e.getMessage(), e);
		}
	}

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
			logger.warn("Invalid status string received: '{}', defaulting to BACKLOG", text);
			return BACKLOG;
		}

		public static Optional<TaskStatus> valueOfDisplayName(String displayName) {
			return Arrays.stream(values())
					.filter(status -> status.displayName.equalsIgnoreCase(displayName))
					.findFirst();
		}
	}

	private static class UserState {
		Long loggedInUserId;
		String userName;
		Long selectedTaskId;
		String currentAction = "NORMAL";
		Task NewTask;
		String loginEmail; 

		UserState() {
			reset();
		}

		void reset() {
			this.loggedInUserId = null;
			this.userName = null;
			softReset();
		}

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

	private UserState findUserOrNewState(long chatId) {
		UserState newState = new UserState();
		userRepository.findByChatId(chatId).ifPresent(user -> {
			newState.loggedInUserId = user.getId();
			newState.userName = user.getName();
			logger.debug("Found existing user {} for chat {}", newState.userName, chatId);
		});
		return newState;
	}

	@Override
	public void onUpdateReceived(Update update) {
		final long chatId;
		String text = null;
		String callbackData = null;
		boolean isCallback = update.hasCallbackQuery();
		boolean isMessage = update.hasMessage() && update.getMessage().hasText();

		// Prepare to handle and log.
		// If this raises, we are cooked anyway
		if (isCallback) {
			chatId = update.getCallbackQuery().getMessage().getChatId();
			callbackData = update.getCallbackQuery().getData();
			logger.debug("Handling callback query from Tel_ID {}: {}", chatId, callbackData);
		} else if (isMessage) {
			chatId = update.getMessage().getChatId();
			text = update.getMessage().getText();
			logger.debug("Handling message from Tel_ID {}: {}", chatId, text);
		} else {
			return; // Maybe an error? What would lead to this?
		}

		try {
			UserState state = userStates.computeIfAbsent(chatId, k -> findUserOrNewState(chatId));

			if (state == null) {
				logger.error("UserState became null after computeIfAbsent for chat ID: {}", chatId);
				UserState finalState = findUserOrNewState(chatId);
				if (finalState == null) {
					sendMessage(chatId,
							"Error interno del bot (estado de usuario). Por favor, intente de nuevo más tarde.");
					return;
				}
				userStates.put(chatId, finalState);
				state = finalState;
			}

			if (isMessage) {
				logger.debug("Processing text '{}' in context {}", text, state);
				handleTextMessage(chatId, text, state);
			} else if (isCallback) {
				logger.debug("Processing callback '{}' in context {}", callbackData, state);

				if (state.loggedInUserId == null && !callbackData.startsWith(LOGIN_USER_PREFIX)) {
					logger.debug("Chat {} received callback '{}' but is not logged in.", chatId, callbackData);
					sendMessage(chatId,
							"No has iniciado sesión actualmente. Inicia sesión con '/login' para continuar.");
					return;
				}

				handleCallback(chatId, callbackData, state);
			}
		} catch (Exception e) {
			logger.error("Unhandled exception during onUpdateReceived for chat {}: {}",
					chatId, e.getMessage(), e);

			// chatId is always set
			sendMessage(chatId,
				    "Ocurrió un error inesperado procesando tu solicitud. " +
				    "Por favor, intenta de nuevo más tarde o usa /cancel.");

			UserState errorState = userStates.get(chatId);
			if (errorState != null) {
				errorState.softReset();
			}
		}
	}

	private void showUserList(long chatId) {
		List<User> allUsers = userRepository.findAll(100000, 0);

		if (allUsers.isEmpty()) {
			sendMessage(chatId, "No hay usuarios registrados.");
			return;
		}

		List<TelegramUI.ButtonData> buttons = allUsers.stream()
				.map(user -> new TelegramUI.ButtonData(
						user.getName() + " (" + user.getEmail() + ")",
						LOGIN_USER_PREFIX + user.getId()))
				.collect(Collectors.toList());

		InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
		sendMessage(chatId, "Selecciona tu usuario:", markup);
	}

	private void listTasksForUser(long chatId, Long userId) {
		List<Task> tasks = taskRepository.findTasksAssignedToUser(userId);

		List<TelegramUI.ButtonData> buttons = tasks.stream()
				.map(task -> new TelegramUI.ButtonData(
						task.getTitle() + " [ID: " + task.getId() + "]",
						TASK_PREFIX + task.getId()))
				.collect(Collectors.toList());

		buttons.add(new TelegramUI.ButtonData("Agregar tarea", ADD_TASK_TITLE));

		InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
		String message = tasks.isEmpty() ? "No tienes tareas asignadas:" : "Estas son tus tareas asignadas:";

		sendMessage(chatId, message, markup);
	}

	private void showTaskDetails(long chatId, Long taskId) {
		Optional<Task> optTask = taskRepository.findById(taskId);
		if (optTask.isEmpty()) {
			sendMessage(chatId, "Tarea no encontrada con ID: " + taskId);
			return;
		}

		Task task = optTask.get();

		String sprintName = "Sin sprint";
		if (task.getSprintId() != null) {
			sprintName = sprintRepository.findById(task.getSprintId())
					.map(Sprint::getName)
					.orElse("Sprint ID " + task.getSprintId() + " no encontrado");
		}

		String messageText = String.format(
				"Tarea: %s\nDescripción: %s\nTag: %s\nSprint: %s\nEstado: %s\nInicio: %s\nFin: %s\nHoras Estimadas: %s\nHoras Reales: %s\n",
				task.getTitle(),
				task.getDescription(),
				task.getTag() != null ? task.getTag() : "--",
				sprintName,
				task.getStatus(),
				task.getStartDate() != null ? task.getStartDate() : "--",
				task.getEndDate() != null ? task.getEndDate() : "--",
				(task.getEstimatedHours() != null) ? task.getEstimatedHours() : "--",
				(task.getActualHours() != null) ? task.getActualHours() : "--");

		List<TelegramUI.ButtonData> buttons = Arrays.asList(
				new TelegramUI.ButtonData("Ver comentarios", SHOW_COMMENTS),
				new TelegramUI.ButtonData("Agregar comentario", ADD_COMMENT),
				new TelegramUI.ButtonData("Cambiar estatus", CHANGE_STATUS),
				new TelegramUI.ButtonData("Colocar horas reales", CHANGE_REAL_HOURS));

		InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
		sendMessage(chatId, messageText, markup);
	}

	private void showComments(long chatId, Long taskId) {
		if (taskId == null) {
			sendMessage(chatId, "No has seleccionado ninguna tarea.");
			return;
		}

		List<Comment> comments = commentRepository.findByTaskId(taskId);
		if (comments.isEmpty()) {
			sendMessage(chatId, "No hay comentarios para esta tarea.");
			return;
		}

		StringBuilder sb = new StringBuilder("Comentarios:\n");
		for (Comment comment : comments) {
			sb.append(String.format(
					"- %s dice: %s\n",
					(comment.getCreatorName() != null ? comment.getCreatorName() : "Desconocido"),
					comment.getContent()));
		}
		sendMessage(chatId, sb.toString());
	}

	private void addNewComment(long chatId, Long taskId, Long userId, String content) {
		if (taskId == null || userId == null) {
			sendMessage(chatId, "No se puede crear comentario: Falta tarea o usuario.");
			return;
		}

		String authorName = userRepository.findById(userId)
				.map(User::getName)
				.orElse("Usuario ID " + userId);

		Comment comment = new Comment();
		comment.setTaskId(taskId);
		comment.setContent(content);
		comment.setCreatorId(userId);
		comment.setCreatorName(authorName);
		comment.setCreatedAt(new Date());

		commentRepository.insert(comment);
		sendMessage(chatId, "Comentario agregado correctamente.");
	}

	private void createNewTask(Long chatId, UserState state) {
		Long taskId = jdbi.withHandle(handle -> {
			TaskRepository taskRepo = handle.attach(TaskRepository.class);
			UserRepository userRepo = handle.attach(UserRepository.class);

			state.NewTask.setCreatorId(state.loggedInUserId);
			state.NewTask.setStartDate(new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
			state.NewTask.setActualHours(null);
			state.NewTask.setEndDate(null);
			state.NewTask.setStatus(TaskStatus.BACKLOG.getDisplayName());

			Optional<User> currentUserOpt = userRepo.findById(state.loggedInUserId);
			if (currentUserOpt.isEmpty()) {
				logger.error("Cannot create task: logged in user ID {} not found in DB.", state.loggedInUserId);
				sendMessage(chatId, "Error: No se pudo encontrar tu usuario para crear la tarea.");
				return null;
			}

			User currentUser = currentUserOpt.get();
			state.NewTask.setCreatorName(currentUser.getName());
			state.NewTask.setTeamId(currentUser.getTeamId());

			if (currentUser.getTeamId() == null) {
				logger.warn("User {} has no team ID, task {} will not have a team ID.",
						currentUser.getName(), state.NewTask.getTitle());
			}

			Long newTaskId = taskRepo.insert(state.NewTask);

			if (newTaskId != null) {
				taskRepo.addAssignee(newTaskId, state.loggedInUserId);
				logger.info("Task {} created with ID {} and assigned to user {}",
						state.NewTask.getTitle(), newTaskId, state.loggedInUserId);
			} else {
				logger.error("Task insertion failed for task title: {}", state.NewTask.getTitle());
			}

			return newTaskId;
		});

		if (taskId != null) {
			sendMessage(chatId, "¡Tarea creada correctamente con ID: " + taskId + "!");
			state.selectedTaskId = taskId;
			state.currentAction = "NORMAL";
			listTasksForUser(chatId, state.loggedInUserId);
		} else {
			sendMessage(chatId, "Error al crear la tarea. Por favor, intenta nuevamente.");
			state.currentAction = "NORMAL";
			listTasksForUser(chatId, state.loggedInUserId);
		}
	}

	// TODO: eraseTask() no se usa?
	/*
	 * private void eraseTask(long chatId, Long taskId, Long userId) {
	 * if (taskId == null) {
	 * sendMessage(chatId, "No se puede eliminar la tarea: ID no válido.");
	 * return;
	 * }
	 * 
	 * int deletedRows = taskRepository.delete(taskId);
	 * 
	 * if (deletedRows > 0) {
	 * sendMessage(chatId, "Tarea eliminada correctamente.");
	 * logger.info("Task {} deleted by user {}", taskId, userId);
	 * } else {
	 * sendMessage(chatId, "No se pudo eliminar la tarea (quizás ya no existía).");
	 * logger.warn("Attempted to delete non-existent task {} by user {}", taskId,
	 * userId);
	 * }
	 * 
	 * listTasksForUser(chatId, userId);
	 * }
	 */

	private void showSprintsForTeam(long chatId, Long teamId) {
		List<Sprint> sprints = sprintRepository.findByTeamId(teamId);
		UserState state = userStates.get(chatId);

		if (sprints.isEmpty()) {
			sendMessage(chatId,
					"No hay sprints disponibles para tu equipo. La tarea se creará sin asignar a un sprint.");

			if (state != null && state.NewTask != null) {
				state.NewTask.setSprintId(null);
				createNewTask(chatId, state);
			} else {
				logger.error("State or NewTask is null when trying to create task without sprint for chat {}", chatId);
				sendMessage(chatId, "Error interno al procesar la creación de la tarea.");
			}
			return;
		}

		List<TelegramUI.ButtonData> buttons = sprints.stream()
				.map(sprint -> new TelegramUI.ButtonData(
						sprint.getName(),
						SPRINT_SELECT_PREFIX + sprint.getId()))
				.collect(Collectors.toList());

		buttons.add(new TelegramUI.ButtonData("Sin sprint", SPRINT_SELECT_PREFIX + NO_SPRINT_OPTION));

		InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
		sendMessage(chatId, "Selecciona el sprint para esta tarea:", markup);
	}

	private void showTagOptions(long chatId) {
		List<TelegramUI.ButtonData> buttons = Arrays.asList(
				new TelegramUI.ButtonData(FEATURE, TAG_SELECT_PREFIX + FEATURE),
				new TelegramUI.ButtonData(ISSUE, TAG_SELECT_PREFIX + ISSUE));

		InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
		sendMessage(chatId, "Selecciona el tag para la tarea:", markup);
	}

	private void showStatusOptions(long chatId, long taskId) {
		List<TelegramUI.ButtonData> buttons = Arrays.stream(TaskStatus.values())
				.map(status -> new TelegramUI.ButtonData(
						status.getDisplayName(),
						STATUS_SELECT_PREFIX + status.name()))
				.collect(Collectors.toList());

		InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
		sendMessage(chatId, "Selecciona el nuevo estado para la tarea:", markup);
	}

	private void handleTextMessage(long chatId, String text, UserState state) {
		if ("/login".equalsIgnoreCase(text)) {
			state.currentAction = PUT_EMAIL;
			sendMessage(chatId,"Email: ");
			return;
		}

		if ("/logout".equalsIgnoreCase(text)) {
			userRepository.forgetChatId(chatId);
			sendMessage(chatId, "Terminando sesión como " + state.userName);
			state.reset();
			return;
		}

		if ("/start".equalsIgnoreCase(text) || "/tasks".equalsIgnoreCase(text)) {
			if (state.loggedInUserId == null) {
				sendMessage(chatId, "No hay sesión iniciada. Por favor, usa /login.");
				//showUserList(chatId);
			} else {
				sendMessage(chatId, "Sesión iniciada como " + state.userName
						+ " automáticamente. Usa '/logout' para ingresar como otro usuario.");
				listTasksForUser(chatId, state.loggedInUserId);
			}
			return;
		}

		if ("/whoami".equalsIgnoreCase(text)) {
			if (state.loggedInUserId == null || state.userName == null) {
				sendMessage(chatId, "No has iniciado sesión. Usa /login.");
			} else {
				sendMessage(chatId, "Sesión de " + state.userName);
			}
			return;
		}

		if ("/cancel".equalsIgnoreCase(text)) {
			boolean wasInProgress = !"NORMAL".equals(state.currentAction);
			state.softReset();
			sendMessage(chatId, "Acción cancelada.");
			if (wasInProgress && state.loggedInUserId != null) {
				listTasksForUser(chatId, state.loggedInUserId);
			}
			return;
		}

		switch (state.currentAction) {
			case "ADDING_COMMENT":
				if (state.selectedTaskId == null) {
					sendMessage(chatId,
							"Error: No hay tarea seleccionada para añadir comentario. Usa /cancel.");
				} else {
					addNewComment(chatId, state.selectedTaskId, state.loggedInUserId, text);
					state.currentAction = "NORMAL";
					showTaskDetails(chatId, state.selectedTaskId);
				}
				break;

			case "ADDING_TASK_TITLE":
				state.NewTask = new Task();
				state.NewTask.setTitle(text);
				state.currentAction = "ADDING_TASK_DESCRIPTION";
				sendMessage(chatId, "Por favor, escribe la descripción de la tarea:");
				sendMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
				break;

			case "ADDING_TASK_DESCRIPTION":
				if (state.NewTask == null) {
					sendMessage(chatId, "Error: No se encontró la tarea en progreso. Usa /cancel.");
					state.softReset();
					break;
				}
				state.NewTask.setDescription(text);
				state.currentAction = "ADDING_TASK_ESTIMATED_HOURS";
				sendMessage(chatId, "Por favor, escribe las horas estimadas de la tarea (número):");
				break;

			case "ADDING_TASK_ESTIMATED_HOURS":
				if (state.NewTask == null) {
					sendMessage(chatId, "Error: No se encontró la tarea en progreso. Usa /cancel.");
					state.softReset();
					break;
				}
				try {
					state.NewTask.setEstimatedHours(Double.parseDouble(text));
					showTagOptions(chatId);
				} catch (NumberFormatException e) {
					logger.warn("Invalid number format for estimated hours from chat {}: {}", chatId, text);
					sendMessage(chatId,
							"Formato inválido. Por favor, escribe un número para las horas estimadas (ej: 2.5):");
				}
				break;

			case "ADDING_TASK_REAL_TIME":
				if (state.selectedTaskId == null) {
					sendMessage(chatId,
							"Error: No hay tarea seleccionada para añadir horas reales. Usa /cancel.");
					state.softReset();
					break;
				}
				try {
					double realHours = Double.parseDouble(text);
					taskRepository.updateRealHours(state.selectedTaskId, realHours);
					sendMessage(chatId, "Horas reales actualizadas.");
					state.softReset();
					listTasksForUser(chatId, state.loggedInUserId);
				} catch (NumberFormatException e) {
					logger.warn("Invalid number format for real hours from chat {}: {}", chatId, text);
					sendMessage(chatId,
							"Formato inválido. Por favor, escribe un número para las horas reales (ej: 3):");
				}
				break;

			case PUT_EMAIL:
				state.loginEmail = text.trim().toLowerCase();
				state.currentAction = PUT_PASS;
				sendMessage(chatId, "Contraseña:");
				break;
				
			case PUT_PASS:
				try {
					String email = state.loginEmail;
					String password = text;
					
					// Autenticar usando el servicio
					User authenticatedUser = autentication.authenticate(email, password);
					
					// Limpiar datos temporales
					state.loginEmail = null;
					
					// Si llegamos aquí, la autenticación fue exitosa
					userRepository.forgetChatId(chatId);
					userRepository.setChatIdForUser(authenticatedUser.getId(), chatId);
					
					state.loggedInUserId = authenticatedUser.getId();
					state.userName = authenticatedUser.getName();
					state.currentAction = "NORMAL";
					
					sendMessage(chatId, "Has iniciado sesión como: " + authenticatedUser.getName());
					sendMessage(chatId, "Puedes cerrar sesión con '/logout' en cualquier momento");
					
					// Mostrar tareas del usuario
					listTasksForUser(chatId, authenticatedUser.getId());
				} catch (Exception e) {
					logger.error("Login failed for email: {}", state.loginEmail, e);
					sendMessage(chatId, "Error de autenticación: Correo o contraseña incorrectos.");
					state.loginEmail = null;
					state.currentAction = "NORMAL";
				}
				break;

			default:
				sendMessage(chatId,
						"Comando no reconocido o acción inesperada. " +
								"Usa /tasks para ver tus tareas o /cancel para anular.");
				logger.warn("Unrecognized command or unexpected state '{}' for chat {}: {}",
						state.currentAction, chatId, text);
				break;
		}
	}

	private void handleCallback(long chatId, String callbackData, UserState state) {
		if (callbackData.startsWith(LOGIN_USER_PREFIX)) {
			try {
				String userIdString = callbackData.substring(LOGIN_USER_PREFIX.length());
				Long userId = Long.parseLong(userIdString);

				userRepository.forgetChatId(chatId);
				userRepository.setChatIdForUser(userId, chatId);

				Optional<User> userOpt = userRepository.findById(userId);

				if (userOpt.isPresent()) {
					User user = userOpt.get();
					state.loggedInUserId = userId;
					state.userName = user.getName();
					state.currentAction = "NORMAL";
					sendMessage(chatId, "Has iniciado sesión como usuario: " + user.getName());
					sendMessage(chatId, "Puedes cerrar sesión con '/logout' en cualquier momento");
					listTasksForUser(chatId, userId);
				} else {
					logger.error("Login failed: User ID {} not found after callback.", userId);
					sendMessage(chatId, "Error al iniciar sesión: Usuario no encontrado.");
					state.reset();
				}
			} catch (NumberFormatException e) {
				logger.error("Invalid user ID format in login callback: {}", callbackData, e);
				sendMessage(chatId, "Error interno (formato de ID de usuario inválido).");
			}
			return;
		}

		if (callbackData.startsWith(TASK_PREFIX)) {
			try {
				String taskIdString = callbackData.substring(TASK_PREFIX.length());
				Long taskId = Long.parseLong(taskIdString);
				state.selectedTaskId = taskId;
				state.currentAction = "NORMAL";
				showTaskDetails(chatId, taskId);
			} catch (NumberFormatException e) {
				logger.error("Invalid task ID format in task callback: {}", callbackData, e);
				sendMessage(chatId, "Error interno (formato de ID de tarea inválido).");
			}
			return;
		}

		if (SHOW_COMMENTS.equals(callbackData)) {
			if (state.selectedTaskId == null) {
				sendMessage(chatId, "Por favor, selecciona una tarea primero.");
			} else {
				showComments(chatId, state.selectedTaskId);
				showTaskDetails(chatId, state.selectedTaskId);
			}
			return;
		}

		if (ADD_COMMENT.equals(callbackData)) {
			if (state.selectedTaskId == null) {
				sendMessage(chatId, "Por favor, selecciona una tarea primero.");
			} else {
				state.currentAction = "ADDING_COMMENT";
				sendMessage(chatId, "Por favor, escribe tu comentario ahora:");
				sendMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
			}
			return;
		}

		if (ADD_TASK_TITLE.equals(callbackData)) {
			state.currentAction = "ADDING_TASK_TITLE";
			state.NewTask = new Task();
			sendMessage(chatId, "Por favor, escribe el título de la tarea:");
			sendMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
			return;
		}

		if (callbackData.startsWith(SPRINT_SELECT_PREFIX)) {
			if (state.NewTask == null || !"ADDING_TASK_SPRINT".equals(state.currentAction)) {
				sendMessage(chatId, "Acción inesperada. Usa /cancel para reiniciar.");
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
					state.NewTask.setSprintId(sprintId);
				}

				sendMessage(chatId, "Procesando la creación de la tarea...");
				createNewTask(chatId, state);
			} catch (NumberFormatException e) {
				logger.error("Invalid sprint ID format in sprint select callback: {}", callbackData, e);
				sendMessage(chatId, "Error interno (formato de ID de sprint inválido).");
			}
			return;
		}

		if (CHANGE_STATUS.equals(callbackData)) {
			if (state.selectedTaskId == null) {
				sendMessage(chatId, "Por favor, selecciona una tarea primero.");
			} else {
				sendMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
				showStatusOptions(chatId, state.selectedTaskId);
			}
			return;
		}

		if (callbackData.startsWith(STATUS_SELECT_PREFIX)) {
			if (state.selectedTaskId == null) {
				sendMessage(chatId,
						"Error: No hay tarea seleccionada para cambiar estado. Usa /cancel.");
				state.softReset();
				return;
			}

			String statusName = callbackData.substring(STATUS_SELECT_PREFIX.length());
			try {
				TaskStatus selectedStatus = TaskStatus.valueOf(statusName);

				if (selectedStatus == TaskStatus.COMPLETED) {
					String endDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
					taskRepository.updateEndDate(state.selectedTaskId, endDate);
					sendMessage(chatId, "Fecha Final declarada como " + endDate);
				}

				taskRepository.updateStatus(state.selectedTaskId, selectedStatus.getDisplayName());
				sendMessage(chatId, "Estado actualizado a: " + selectedStatus.getDisplayName());

				state.currentAction = "NORMAL";
				listTasksForUser(chatId, state.loggedInUserId);
			} catch (IllegalArgumentException e) {
				logger.error("Invalid status name in status select callback: {}", callbackData, e);
				sendMessage(chatId, "Error interno (nombre de estado inválido).");
			}
			return;
		}

		if (callbackData.startsWith(TAG_SELECT_PREFIX)) {
			if (state.NewTask == null || !state.currentAction.startsWith("ADDING_TASK")) {
				sendMessage(chatId, "Acción inesperada. Usa /cancel para reiniciar.");
				logger.warn("Received TAG_SELECT callback in unexpected state {} for chat {}",
						state.currentAction, chatId);
				state.softReset();
				return;
			}

			String tag = callbackData.substring(TAG_SELECT_PREFIX.length());
			if (FEATURE.equals(tag) || ISSUE.equals(tag)) {
				state.NewTask.setTag(tag);
				state.currentAction = "ADDING_TASK_SPRINT";
				sendMessage(chatId, "Por favor, selecciona el sprint para la tarea:");
				sendMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");

				Long teamId = userRepository.findById(state.loggedInUserId)
						.map(User::getTeamId)
						.orElse(null);

				if (teamId != null) {
					showSprintsForTeam(chatId, teamId);
				} else {
					logger.warn("Could not determine team ID for user {} (ID: {}). Task will have no sprint.",
							state.userName, state.loggedInUserId);
					sendMessage(chatId, "No se pudo determinar tu equipo. No se asignará ningún sprint.");
					state.NewTask.setSprintId(null);
					createNewTask(chatId, state);
				}
			} else {
				logger.warn("Invalid tag received in callback for chat {}: {}", chatId, callbackData);
				sendMessage(chatId, "Tag inválido seleccionado.");
				showTagOptions(chatId);
			}
			return;
		}

		if (CHANGE_REAL_HOURS.equals(callbackData)) {
			if (state.selectedTaskId == null) {
				sendMessage(chatId, "Por favor, selecciona una tarea primero.");
			} else {
				state.currentAction = "ADDING_TASK_REAL_TIME";
				sendMessage(chatId, "Por favor, escribe las horas reales de la tarea (número):");
				sendMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
			}
			return;
		}

		sendMessage(chatId, "Acción no reconocida.");
		logger.warn("Unrecognized callback data received for chat {}: {}", chatId, callbackData);
	}
}
