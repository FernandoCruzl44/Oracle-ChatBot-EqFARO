package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.repository.SprintRepository;

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
	private final String botUsername;
	private final Map<Long, ConversationContext> chatContexts = new ConcurrentHashMap<>();

	// Repositories
	private UserRepository userRepository;
	private TaskRepository taskRepository;
	private CommentRepository commentRepository;
	private SprintRepository sprintRepository;

	// Command constants
	private static final String CMD_LOGIN = "/login";
	private static final String CMD_LOGOUT = "/logout";
	private static final String CMD_START = "/start";
	private static final String CMD_TASKS = "/tasks";
	private static final String CMD_WHOAMI = "/whoami";
	private static final String CMD_CANCEL = "/cancel";

	// Callback prefixes
	private static final String CB_LOGIN_USER = "login_";
	private static final String CB_TASK = "task_";
	private static final String CB_SHOW_COMMENTS = "showComments";
	private static final String CB_ADD_COMMENT = "addComment";
	private static final String CB_ADD_TASK = "addTaskTitle";
	private static final String CB_SPRINT_SELECT = "sprint_select_";
	private static final String CB_NO_SPRINT = "no_sprint";
	private static final String CB_STATUS_SELECT = "status_select_";
	private static final String CB_CHANGE_STATUS = "change_status";
	private static final String CB_TAG_SELECT = "tag_select_";
	private static final String CB_CHANGE_REAL_HOURS = "real_hours";
	private static final String CB_BACK_TO_LIST = "back_to_list";
	private static final String CB_BACK_TO_TASK = "back_to_task";

	// Task tags
	private static final String TAG_FEATURE = "Feature";
	private static final String TAG_ISSUE = "Issue";

	public BotController(String botToken, String botUsername, Jdbi jdbi) {
		super(botToken);
		this.botUsername = botUsername;
		this.jdbi = jdbi;

		// Initialize repositories
		this.userRepository = jdbi.onDemand(UserRepository.class);
		this.taskRepository = jdbi.onDemand(TaskRepository.class);
		this.commentRepository = jdbi.onDemand(CommentRepository.class);
		this.sprintRepository = jdbi.onDemand(SprintRepository.class);

		logger.info("BotController initialized for username: {}", botUsername);
	}

	@Override
	public String getBotUsername() {
		return this.botUsername;
	}

	@Override
	public void onUpdateReceived(Update update) {
		long chatId = 0;
		String messageText = null;
		String callbackData = null;

		try {
			final long finalChatId;
			if (update.hasCallbackQuery()) {
				finalChatId = update.getCallbackQuery().getMessage().getChatId();
				callbackData = update.getCallbackQuery().getData();
				logger.debug("Handling callback query from chat {}: {}", finalChatId, callbackData);
			} else if (update.hasMessage() && update.getMessage().hasText()) {
				finalChatId = update.getMessage().getChatId();
				messageText = update.getMessage().getText();
				logger.debug("Handling message from chat {}: {}", finalChatId, messageText);
			} else {
				// Ignore non-text messages
				return;
			}

			// Get or create conversation context for this chat
			ConversationContext context = chatContexts.computeIfAbsent(finalChatId,
					id -> new ConversationContext(finalChatId, this));

			// Process the update
			if (messageText != null) {
				handleTextMessage(context, messageText);
			} else if (callbackData != null) {
				handleCallbackQuery(context, callbackData);
			}
		} catch (Exception e) {
			logger.error("Unhandled exception during update processing: {}", e.getMessage(), e);
			try {
				// Guardar el chatId en una variable final para usarlo dentro del bloque
				final long finalChatId = chatId;
				if (update.hasMessage() && finalChatId != 0) {
					sendMessage(finalChatId,
							"Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde o usa /cancel.");

					// Reset conversation to a safe state
					ConversationContext context = chatContexts.get(finalChatId);
					if (context != null) {
						context.transitionTo(new IdleState());
					}
				}
			} catch (Exception ex) {
				logger.error("Failed to send error message to user: {}", ex.getMessage(), ex);
			}
		}
	}

	/**
	 * Utility method to send a message to a chat
	 */
	void sendMessage(long chatId, String text) {
		sendMessage(chatId, text, null);
	}

	/**
	 * Utility method to send a message with a keyboard to a chat
	 */
	void sendMessage(long chatId, String text, InlineKeyboardMarkup markup) {
		SendMessage message = new SendMessage();
		message.setChatId(String.valueOf(chatId));
		message.setText(text);
		message.enableMarkdown(true);

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

	/**
	 * Handle text messages based on command or current state
	 */
	private void handleTextMessage(ConversationContext context, String text) {
		// Check for command messages first
		if (text.startsWith("/")) {
			switch (text.toLowerCase()) {
				case CMD_LOGIN:
					context.transitionTo(new LoginState());
					return;
				case CMD_LOGOUT:
					context.logout();
					return;
				case CMD_START:
				case CMD_TASKS:
					context.showTasksOrLogin();
					return;
				case CMD_WHOAMI:
					context.showCurrentUser();
					return;
				case CMD_CANCEL:
					context.cancel();
					return;
				default:
					context.sendMessage("Comando no reconocido. Usa /tasks para ver tus tareas o /cancel para anular.");
					return;
			}
		}

		// If not a command, delegate to the current state
		context.getCurrentState().handleTextMessage(context, text);
	}

	/**
	 * Handle callback queries by delegating to the current state
	 */
	private void handleCallbackQuery(ConversationContext context, String callbackData) {
		// Special case for login callbacks which work from any state
		if (callbackData.startsWith(CB_LOGIN_USER)) {
			String userIdStr = callbackData.substring(CB_LOGIN_USER.length());
			try {
				long userId = Long.parseLong(userIdStr);
				context.login(userId);
			} catch (NumberFormatException e) {
				logger.error("Invalid user ID format in login callback: {}", callbackData, e);
				context.sendMessage("Error interno (formato de ID de usuario inválido).");
			}
			return;
		}

		// For all other callbacks, check if user is logged in
		if (context.getUser() == null && !callbackData.startsWith(CB_LOGIN_USER)) {
			context.sendMessage("No has iniciado sesión actualmente. Inicia sesión con '/login' para continuar.");
			context.transitionTo(new LoginState());
			return;
		}

		// Delegate to current state
		context.getCurrentState().handleCallbackQuery(context, callbackData);
	}

	/**
	 * Conversation context holds the current state and user information
	 */
	public class ConversationContext {
		private final long chatId;
		private final BotController bot;
		private ConversationState currentState;
		private User user;
		private Task currentTask;
		private Long selectedTaskId;

		public ConversationContext(long chatId, BotController bot) {
			this.chatId = chatId;
			this.bot = bot;
			this.currentState = new IdleState();

			// Check if user is already logged in
			Optional<User> existingUser = userRepository.findByChatId(chatId);
			existingUser.ifPresent(u -> this.user = u);
		}

		public void transitionTo(ConversationState newState) {
			logger.debug("Chat {} transitioning from {} to {}",
					chatId,
					currentState.getClass().getSimpleName(),
					newState.getClass().getSimpleName());

			this.currentState = newState;
			newState.enter(this);
		}

		public void sendMessage(String text) {
			bot.sendMessage(chatId, text);
		}

		public void sendMessage(String text, InlineKeyboardMarkup markup) {
			bot.sendMessage(chatId, text, markup);
		}

		public User getUser() {
			return user;
		}

		public Long getChatId() {
			return chatId;
		}

		public Task getCurrentTask() {
			return currentTask;
		}

		public void setCurrentTask(Task task) {
			this.currentTask = task;
		}

		public Long getSelectedTaskId() {
			return selectedTaskId;
		}

		public void setSelectedTaskId(Long taskId) {
			this.selectedTaskId = taskId;

			// If taskId is set, automatically load the Task
			if (taskId != null) {
				taskRepository.findById(taskId).ifPresent(this::setCurrentTask);
			} else {
				setCurrentTask(null);
			}
		}

		public ConversationState getCurrentState() {
			return currentState;
		}

		/**
		 * Log in as a specific user
		 */
		public void login(long userId) {
			try {
				// Update database
				userRepository.forgetChatId(chatId);
				userRepository.setChatIdForUser(userId, chatId);

				// Update context
				Optional<User> userOpt = userRepository.findById(userId);
				if (userOpt.isPresent()) {
					this.user = userOpt.get();
					sendMessage("Has iniciado sesión como usuario: " + user.getName());
					sendMessage("Puedes cerrar sesión con '/logout' en cualquier momento");

					// Show tasks after login
					transitionTo(new TaskListState());
				} else {
					logger.error("Login failed: User ID {} not found.", userId);
					sendMessage("Error al iniciar sesión: Usuario no encontrado.");
					transitionTo(new IdleState());
				}
			} catch (Exception e) {
				logger.error("Error during login process: {}", e.getMessage(), e);
				sendMessage("Error al iniciar sesión. Por favor, intenta de nuevo.");
				transitionTo(new IdleState());
			}
		}

		/**
		 * Log out current user
		 */
		public void logout() {
			if (user != null) {
				sendMessage("Terminando sesión como " + user.getName());
				userRepository.forgetChatId(chatId);
				user = null;
				currentTask = null;
				selectedTaskId = null;
				transitionTo(new IdleState());
			} else {
				sendMessage("No has iniciado sesión actualmente.");
			}
		}

		/**
		 * Cancel current action and go back to task list or idle state
		 */
		public void cancel() {
			sendMessage("Acción cancelada.");
			if (user != null) {
				transitionTo(new TaskListState());
			} else {
				transitionTo(new IdleState());
			}
		}

		/**
		 * Show tasks if logged in, otherwise prompt for login
		 */
		public void showTasksOrLogin() {
			if (user != null) {
				sendMessage(
						"Sesión iniciada como " + user.getName() + ". Usa '/logout' para ingresar como otro usuario.");
				transitionTo(new TaskListState());
			} else {
				sendMessage("No hay sesión iniciada. Por favor, usa /login.");
				transitionTo(new LoginState());
			}
		}

		/**
		 * Show current user info
		 */
		public void showCurrentUser() {
			if (user != null) {
				sendMessage("Sesión de " + user.getName());
			} else {
				sendMessage("No has iniciado sesión. Usa /login.");
			}
		}
	}

	/**
	 * Base class for all conversation states
	 */
	public abstract class ConversationState {
		/**
		 * Called when entering this state
		 */
		public abstract void enter(ConversationContext context);

		/**
		 * Handle text messages in this state
		 */
		public abstract void handleTextMessage(ConversationContext context, String text);

		/**
		 * Handle callback queries in this state
		 */
		public abstract void handleCallbackQuery(ConversationContext context, String callbackData);
	}

	/**
	 * Idle state - initial state when no user is logged in
	 */
	public class IdleState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			// No action needed when entering idle state
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			// In idle state, only commands are handled, which is done in the parent method
			context.sendMessage("Por favor, inicia sesión con /login o usa /start para comenzar.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			// In idle state, only login callbacks are handled, which is done in the parent
			// method
			context.sendMessage("Por favor, inicia sesión primero.");
		}
	}

	/**
	 * Login state - showing user list for login
	 */
	public class LoginState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			List<User> allUsers = userRepository.findAll(100000, 0);

			if (allUsers.isEmpty()) {
				context.sendMessage("No hay usuarios registrados.");
				context.transitionTo(new IdleState());
				return;
			}

			List<TelegramUI.ButtonData> buttons = allUsers.stream()
					.map(user -> new TelegramUI.ButtonData(
							user.getName() + " (" + user.getEmail() + ")",
							CB_LOGIN_USER + user.getId()))
					.collect(Collectors.toList());

			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			context.sendMessage("Selecciona tu usuario:", markup);
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			// In login state, only expect commands which are handled by parent
			context.sendMessage("Por favor, selecciona un usuario de la lista.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			// Login callbacks are handled in the parent method
			// This is reached only for non-login callbacks
			context.sendMessage("Por favor, selecciona un usuario primero.");
		}
	}

	/**
	 * Task list state - showing tasks for the current user
	 */
	public class TaskListState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			User user = context.getUser();
			if (user == null) {
				logger.error("Attempted to enter TaskListState without a logged in user");
				context.sendMessage("Error: No has iniciado sesión.");
				context.transitionTo(new IdleState());
				return;
			}

			List<Task> tasks = taskRepository.findTasksAssignedToUser(user.getId());

			List<TelegramUI.ButtonData> buttons = tasks.stream()
					.map(task -> new TelegramUI.ButtonData(
							task.getTitle() + " [ID: " + task.getId() + "]",
							CB_TASK + task.getId()))
					.collect(Collectors.toList());

			buttons.add(new TelegramUI.ButtonData("+ Agregar tarea", CB_ADD_TASK));

			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			String message = tasks.isEmpty()
					? "No tienes tareas asignadas:"
					: "Estas son tus tareas asignadas:";

			context.sendMessage(message, markup);
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			// In task list, only expect commands which are handled by parent
			context.sendMessage("Por favor, selecciona una tarea de la lista o usa los comandos disponibles.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			if (callbackData.startsWith(CB_TASK)) {
				try {
					Long taskId = Long.parseLong(callbackData.substring(CB_TASK.length()));
					context.setSelectedTaskId(taskId);
					context.transitionTo(new TaskDetailsState());
				} catch (NumberFormatException e) {
					logger.error("Invalid task ID format in task callback: {}", callbackData, e);
					context.sendMessage("Error interno (formato de ID de tarea inválido).");
				}
			} else if (callbackData.equals(CB_ADD_TASK)) {
				context.setCurrentTask(new Task());
				context.transitionTo(new AddTaskTitleState());
			} else {
				context.sendMessage("Acción no reconocida.");
			}
		}
	}

	/**
	 * Task details state - showing details of a specific task
	 */
	public class TaskDetailsState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			Task task = context.getCurrentTask();
			if (task == null) {
				logger.error("Attempted to enter TaskDetailsState without a selected task");
				context.sendMessage("Error: No hay tarea seleccionada.");
				context.transitionTo(new TaskListState());
				return;
			}

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
					new TelegramUI.ButtonData("Ver comentarios", CB_SHOW_COMMENTS),
					new TelegramUI.ButtonData("Agregar comentario", CB_ADD_COMMENT),
					new TelegramUI.ButtonData("Cambiar estatus", CB_CHANGE_STATUS),
					new TelegramUI.ButtonData("Colocar horas reales", CB_CHANGE_REAL_HOURS),
					new TelegramUI.ButtonData("← Volver a la lista", CB_BACK_TO_LIST));

			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			context.sendMessage(messageText, markup);
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			// In task details, only expect commands which are handled by parent
			context.sendMessage("Por favor, selecciona una acción de las opciones disponibles.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			switch (callbackData) {
				case CB_SHOW_COMMENTS:
					context.transitionTo(new ShowCommentsState());
					break;
				case CB_ADD_COMMENT:
					context.transitionTo(new AddCommentState());
					break;
				case CB_CHANGE_STATUS:
					context.transitionTo(new ChangeStatusState());
					break;
				case CB_CHANGE_REAL_HOURS:
					context.transitionTo(new ChangeRealHoursState());
					break;
				case CB_BACK_TO_LIST:
					context.transitionTo(new TaskListState());
					break;
				default:
					context.sendMessage("Acción no reconocida.");
			}
		}
	}

	/**
	 * Show comments state - displays comments for a task
	 */
	public class ShowCommentsState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			Long taskId = context.getSelectedTaskId();
			if (taskId == null) {
				context.sendMessage("No has seleccionado ninguna tarea.");
				context.transitionTo(new TaskListState());
				return;
			}

			List<Comment> comments = commentRepository.findByTaskId(taskId);
			if (comments.isEmpty()) {
				context.sendMessage("No hay comentarios para esta tarea.");
			} else {
				StringBuilder sb = new StringBuilder("Comentarios:\n");
				for (Comment comment : comments) {
					sb.append(String.format(
							"[%s]: %s\n",
							(comment.getCreatorName() != null ? comment.getCreatorName() : "Desconocido"),
							comment.getContent()));
				}
				context.sendMessage(sb.toString());
			}

			List<TelegramUI.ButtonData> buttons = Arrays.asList(
					new TelegramUI.ButtonData("← Volver a la tarea", CB_BACK_TO_TASK));
			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			context.sendMessage("Selecciona una acción:", markup);
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			if (CB_BACK_TO_TASK.equals(callbackData)) {
				context.transitionTo(new TaskDetailsState());
			}
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			context.sendMessage("Por favor, usa los botones disponibles o /cancel para cancelar.");
		}
	}

	/**
	 * Add comment state - allows adding a comment to a task
	 */
	public class AddCommentState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			if (context.getSelectedTaskId() == null) {
				context.sendMessage("Error: No hay tarea seleccionada para añadir comentario.");
				context.transitionTo(new TaskListState());
				return;
			}

			context.sendMessage("Por favor, escribe tu comentario ahora:");
			context.sendMessage("Puedes cancelar esta acción en todo momento con /cancel");
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			Long taskId = context.getSelectedTaskId();
			User user = context.getUser();

			if (taskId == null || user == null) {
				context.sendMessage("No se puede crear comentario: Falta tarea o usuario.");
				context.transitionTo(new TaskListState());
				return;
			}

			Comment comment = new Comment();
			comment.setTaskId(taskId);
			comment.setContent(text);
			comment.setCreatorId(user.getId());
			comment.setCreatorName(user.getName());
			comment.setCreatedAt(new Date());

			commentRepository.insert(comment);
			context.sendMessage("Comentario agregado correctamente.");

			// Return to task details
			context.transitionTo(new TaskDetailsState());
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			context.sendMessage("Por favor, escribe el comentario o usa /cancel para cancelar.");
		}
	}

	/**
	 * Change task status state
	 */
	public class ChangeStatusState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			if (context.getSelectedTaskId() == null) {
				context.sendMessage("Error: No hay tarea seleccionada para cambiar estado.");
				context.transitionTo(new TaskListState());
				return;
			}

			List<TelegramUI.ButtonData> buttons = new ArrayList<>();
			Arrays.stream(TaskStatus.values())
					.forEach(status -> buttons.add(new TelegramUI.ButtonData(
							status.getDisplayName(),
							CB_STATUS_SELECT + status.name())));

			buttons.add(new TelegramUI.ButtonData("← Volver a la tarea", CB_BACK_TO_TASK));
			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			context.sendMessage("Selecciona el nuevo estado para la tarea:", markup);
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			context.sendMessage("Por favor, selecciona un estado de la lista o usa /cancel para cancelar.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			if (CB_BACK_TO_TASK.equals(callbackData)) {
				context.transitionTo(new TaskDetailsState());
				return;
			}

			if (!callbackData.startsWith(CB_STATUS_SELECT)) {
				context.sendMessage("Acción no reconocida.");
				return;
			}

			String statusName = callbackData.substring(CB_STATUS_SELECT.length());
			Long taskId = context.getSelectedTaskId();

			try {
				TaskStatus selectedStatus = TaskStatus.valueOf(statusName);

				if (selectedStatus == TaskStatus.COMPLETED) {
					String endDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
					taskRepository.updateEndDate(taskId, endDate);
					context.sendMessage("Fecha Final declarada como " + endDate);
				}

				taskRepository.updateStatus(taskId, selectedStatus.getDisplayName());
				context.sendMessage("Estado actualizado a: " + selectedStatus.getDisplayName());

				// Go back to task list
				context.transitionTo(new TaskListState());
			} catch (IllegalArgumentException e) {
				logger.error("Invalid status name in status select callback: {}", callbackData, e);
				context.sendMessage("Error interno (nombre de estado inválido).");
				context.transitionTo(new TaskDetailsState());
			}
		}
	}

	/**
	 * Change real hours state
	 */
	public class ChangeRealHoursState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			if (context.getSelectedTaskId() == null) {
				context.sendMessage("Error: No hay tarea seleccionada para añadir horas reales.");
				context.transitionTo(new TaskListState());
				return;
			}

			List<TelegramUI.ButtonData> buttons = Arrays.asList(
					new TelegramUI.ButtonData("← Volver a la tarea", CB_BACK_TO_TASK));
			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);

			context.sendMessage("Por favor, escribe las horas reales de la tarea (número):", markup);
			context.sendMessage("Puedes cancelar esta acción en todo momento con /cancel");
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			Long taskId = context.getSelectedTaskId();

			if (taskId == null) {
				context.sendMessage("Error: No hay tarea seleccionada para añadir horas reales.");
				context.transitionTo(new TaskListState());
				return;
			}

			try {
				double realHours = Double.parseDouble(text);
				taskRepository.updateRealHours(taskId, realHours);
				context.sendMessage("Horas reales actualizadas.");
				context.transitionTo(new TaskListState());
			} catch (NumberFormatException e) {
				logger.warn("Invalid number format for real hours: {}", text);
				context.sendMessage("Formato inválido. Por favor, escribe un número para las horas reales (ej: 3):");
			}
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			if (CB_BACK_TO_TASK.equals(callbackData)) {
				context.transitionTo(new TaskDetailsState());
			} else {
				context.sendMessage("Por favor, escribe las horas reales o usa los botones disponibles.");
			}
		}
	}

	/**
	 * Add task flow - multiple states for each step
	 */
	public class AddTaskTitleState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			Task newTask = new Task();
			context.setCurrentTask(newTask);
			context.sendMessage("Por favor, escribe el título de la tarea:");
			context.sendMessage("Puedes cancelar esta acción en todo momento con /cancel");
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			Task task = context.getCurrentTask();
			if (task == null) {
				context.sendMessage("Error: No se encontró la tarea en progreso.");
				context.transitionTo(new TaskListState());
				return;
			}

			task.setTitle(text);
			context.transitionTo(new AddTaskDescriptionState());
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			context.sendMessage("Por favor, escribe el título de la tarea o usa /cancel para cancelar.");
		}
	}

	/**
	 * Add task description state
	 */
	public class AddTaskDescriptionState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			context.sendMessage("Por favor, escribe la descripción de la tarea:");
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			Task task = context.getCurrentTask();
			if (task == null) {
				context.sendMessage("Error: No se encontró la tarea en progreso.");
				context.transitionTo(new TaskListState());
				return;
			}

			task.setDescription(text);
			context.transitionTo(new AddTaskEstimatedHoursState());
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			context.sendMessage("Por favor, escribe la descripción de la tarea o usa /cancel para cancelar.");
		}
	}

	/**
	 * Add task estimated hours state
	 */
	public class AddTaskEstimatedHoursState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			context.sendMessage("Por favor, escribe las horas estimadas de la tarea (número):");
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			Task task = context.getCurrentTask();
			if (task == null) {
				context.sendMessage("Error: No se encontró la tarea en progreso.");
				context.transitionTo(new TaskListState());
				return;
			}

			try {
				task.setEstimatedHours(Double.parseDouble(text));
				context.transitionTo(new AddTaskTagState());
			} catch (NumberFormatException e) {
				logger.warn("Invalid number format for estimated hours: {}", text);
				context.sendMessage(
						"Formato inválido. Por favor, escribe un número para las horas estimadas (ej: 2.5):");
			}
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			context.sendMessage("Por favor, escribe las horas estimadas o usa /cancel para cancelar.");
		}
	}

	/**
	 * Add task tag state
	 */
	public class AddTaskTagState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			List<TelegramUI.ButtonData> buttons = Arrays.asList(
					new TelegramUI.ButtonData(TAG_FEATURE, CB_TAG_SELECT + TAG_FEATURE),
					new TelegramUI.ButtonData(TAG_ISSUE, CB_TAG_SELECT + TAG_ISSUE));

			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			context.sendMessage("Selecciona el tag para la tarea:", markup);
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			context.sendMessage(
					"Por favor, selecciona un tag de las opciones disponibles o usa /cancel para cancelar.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			if (!callbackData.startsWith(CB_TAG_SELECT)) {
				context.sendMessage("Acción no reconocida.");
				return;
			}

			String tag = callbackData.substring(CB_TAG_SELECT.length());
			Task task = context.getCurrentTask();

			if (task == null) {
				context.sendMessage("Error: No se encontró la tarea en progreso.");
				context.transitionTo(new TaskListState());
				return;
			}

			if (TAG_FEATURE.equals(tag) || TAG_ISSUE.equals(tag)) {
				task.setTag(tag);
				context.transitionTo(new AddTaskSprintState());
			} else {
				logger.warn("Invalid tag received: {}", tag);
				context.sendMessage("Tag inválido seleccionado.");
				enter(context); // Show tag options again
			}
		}
	}

	/**
	 * Add task sprint state
	 */
	public class AddTaskSprintState extends ConversationState {
		@Override
		public void enter(ConversationContext context) {
			User user = context.getUser();
			if (user == null || user.getTeamId() == null) {
				logger.warn("No team ID available for user. Task will have no sprint.");
				context.sendMessage("No se pudo determinar tu equipo. No se asignará ningún sprint.");
				finishTaskCreation(context);
				return;
			}

			List<Sprint> sprints = sprintRepository.findByTeamId(user.getTeamId());
			if (sprints.isEmpty()) {
				context.sendMessage(
						"No hay sprints disponibles para tu equipo. La tarea se creará sin asignar a un sprint.");
				finishTaskCreation(context);
				return;
			}

			List<TelegramUI.ButtonData> buttons = sprints.stream()
					.map(sprint -> new TelegramUI.ButtonData(
							sprint.getName(),
							CB_SPRINT_SELECT + sprint.getId()))
					.collect(Collectors.toList());

			buttons.add(new TelegramUI.ButtonData("Sin sprint", CB_SPRINT_SELECT + CB_NO_SPRINT));

			InlineKeyboardMarkup markup = TelegramUI.createSingleColumnKeyboard(buttons);
			context.sendMessage("Selecciona el sprint para esta tarea:", markup);
		}

		@Override
		public void handleTextMessage(ConversationContext context, String text) {
			context.sendMessage(
					"Por favor, selecciona un sprint de las opciones disponibles o usa /cancel para cancelar.");
		}

		@Override
		public void handleCallbackQuery(ConversationContext context, String callbackData) {
			if (!callbackData.startsWith(CB_SPRINT_SELECT)) {
				context.sendMessage("Acción no reconocida.");
				return;
			}

			String sprintIdStr = callbackData.substring(CB_SPRINT_SELECT.length());
			Task task = context.getCurrentTask();

			if (task == null) {
				context.sendMessage("Error: No se encontró la tarea en progreso.");
				context.transitionTo(new TaskListState());
				return;
			}

			try {
				if (CB_NO_SPRINT.equals(sprintIdStr)) {
					task.setSprintId(null);
				} else {
					Long sprintId = Long.parseLong(sprintIdStr);
					task.setSprintId(sprintId);
				}

				finishTaskCreation(context);
			} catch (NumberFormatException e) {
				logger.error("Invalid sprint ID format: {}", sprintIdStr, e);
				context.sendMessage("Error interno (formato de ID de sprint inválido).");
				context.transitionTo(new TaskListState());
			}
		}

		/**
		 * Complete task creation process
		 */
		private void finishTaskCreation(ConversationContext context) {
			context.sendMessage("Procesando la creación de la tarea...");

			try {
				Long taskId = createNewTask(context);

				if (taskId != null) {
					context.sendMessage("¡Tarea creada correctamente con ID: " + taskId + "!");
					context.setSelectedTaskId(taskId);
				} else {
					context.sendMessage("Error al crear la tarea. Por favor, intenta nuevamente.");
				}

				context.transitionTo(new TaskListState());
			} catch (Exception e) {
				logger.error("Error creating task: {}", e.getMessage(), e);
				context.sendMessage("Error al crear la tarea: " + e.getMessage());
				context.transitionTo(new TaskListState());
			}
		}

		/**
		 * Create new task in database
		 */
		private Long createNewTask(ConversationContext context) {
			Task task = context.getCurrentTask();
			User user = context.getUser();

			if (task == null || user == null) {
				logger.error("Cannot create task: missing task data or user");
				return null;
			}

			return jdbi.withHandle(handle -> {
				TaskRepository taskRepo = handle.attach(TaskRepository.class);

				task.setCreatorId(user.getId());
				task.setStartDate(new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
				task.setActualHours(null);
				task.setEndDate(null);
				task.setStatus(TaskStatus.BACKLOG.getDisplayName());
				task.setCreatorName(user.getName());
				task.setTeamId(user.getTeamId());

				Long newTaskId = taskRepo.insert(task);

				if (newTaskId != null) {
					taskRepo.addAssignee(newTaskId, user.getId());
					logger.info("Task {} created with ID {} and assigned to user {}",
							task.getTitle(), newTaskId, user.getId());
				} else {
					logger.error("Task insertion failed for task title: {}", task.getTitle());
				}

				return newTaskId;
			});
		}
	}

	/**
	 * Utility class for creating Telegram UI elements
	 */
	public static class TelegramUI {
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

	/**
	 * Task status enum
	 */
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
}