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

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class BotController extends TelegramLongPollingBot {
	
	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);

	private final UserRepository userRepository;
	private final TaskRepository taskRepository;
	private final CommentRepository commentRepository;
	private final SprintRepository sprintRepository;

	// Identifiers for callback data
	private static final String LOGIN_USER_PREFIX = "login_";
	private static final String TASK_PREFIX = "task_";
	private static final String SHOW_COMMENTS = "showComments";
	private static final String ADD_COMMENT = "addComment";
	private static final String ADD_TASK_TITLE = "addTaskTitle";
	private static final String ADD_TASK_DESCRIPTION = "addTaskDescription";
	private static final String ADD_TASK_ESTIMATED_HOURS = "addTaskEstimatedHours";
	private static final String ADD_TASL_SPRINT = "addTaskSprint";
	private static final String SPRINT_SELECT_PREFIX = "sprint_select_";
	private static final String NO_SPRINT_OPTION = "no_sprint";
	private static final String STATUS_SELECT_PREFIX = "status_select_";
	private static final String CHANGE_STATUS = "change_status";
	private static final String TAG_SELECT_PREFIX = "tag_select_";
	private static final String FEATURE = "Feature";
	private static final String ISSUE = "Issue";
	private static final String CHANGE_REAL_HOURS = "real_hours";

	// User state management
	// - stores current user (loggedInUserId)
	// - stores current task (selectedTaskId)
	// - stores current action (e.g., "ADDING_COMMENT", "NORMAL")
	private Map<Long, UserState> userStates = new ConcurrentHashMap<>();

	private String botUsername;
	private String botToken;

	public BotController(
			String botToken,
			String botUsername,
			Jdbi jdbi
		) {
		super(botToken);
		this.botToken = botToken;
		this.botUsername = botUsername;

		Handle handle = jdbi.open();

		this.userRepository = handle.attach(UserRepository.class);
		this.taskRepository = handle.attach(TaskRepository.class);
		this.commentRepository = handle.attach(CommentRepository.class);
		this.sprintRepository = handle.attach(SprintRepository.class);

		logger.info("Bot initialized with username: " + botUsername);
	}

	private UserState findUserOrNewState(long chatId) {
		// TODO: Check DB for user, or create new UserState with no user selected.
		UserState new_US = new UserState();

		Optional<User> userOpt = userRepository.findByChatId(chatId);
		if (userOpt.isPresent()) {
			new_US.loggedInUserId = userOpt.get().getId();
			new_US.userName = userOpt.get().getName();
		}

		return new_US;

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
		
		// Método para convertir un string a TaskStatus
		public static TaskStatus fromString(String text) {
			for (TaskStatus status : TaskStatus.values()) {
				if (status.displayName.equalsIgnoreCase(text)) {
					return status;
				}
			}
			return BACKLOG; // Valor por defecto
		}
	}

	@Override
	public void onUpdateReceived(Update update) {
		// If it's a text message
		if (update.hasMessage() && update.getMessage().hasText()) {
			long chatId = update.getMessage().getChatId();
			logger.debug("Handling message from Tel_ID " + chatId);
			String text = update.getMessage().getText();

			// Make sure user has a state entry
			UserState state = userStates.computeIfAbsent(chatId, k -> findUserOrNewState(k));

			logger.debug("Got " + text + " in context " + state);
			// Basic commands
			if ("/login".equalsIgnoreCase(text)) {
				// Solo se termina sesión actual si se usa /logout o se intercambia por otro usuario con este comando.
				showUserList(chatId);
			} else if ("/logout".equalsIgnoreCase(text)) {
				// If this chat was in the DB set to any user, it forgets it.
				sendTelegramMessage(chatId, "Terminando sesión como " + state.userName);
				userRepository.forgetChatId(chatId);
				state.reset();
			} else if ("/start".equalsIgnoreCase(text) || "/tasks".equalsIgnoreCase(text)) {
				if (state.loggedInUserId == null) {
					sendTelegramMessage(chatId, "No hay sesión de este usuario, inicie sesión.");
					showUserList(chatId);
				} else {
					sendTelegramMessage(chatId, "Sesión iniciada como " + state.userName  + " automáticamente, use '/logout' para ingresar como otro usuario.");
					listTasksForUser(chatId, state.loggedInUserId);
				}
			} else if ("/whoami".equalsIgnoreCase(text)) {
				if (state.loggedInUserId == null) {
					sendTelegramMessage(chatId, "No hay sesión de este usuario, inicie sesión.");
				} else {
					sendTelegramMessage(chatId, "Sesión de " + state.userName);
				}
			} else if("/cancel".equalsIgnoreCase(text)){
				state.softReset();
				sendTelegramMessage(chatId, "Acción cancelada.");
				listTasksForUser(chatId, state.loggedInUserId);
			}
			 else {
				// If the user is in the middle of adding a comment, process that
				if ("ADDING_COMMENT".equals(state.currentAction)) {
					addNewComment(chatId, state.selectedTaskId, state.loggedInUserId, text);
					state.currentAction = "NORMAL";
					showComments(chatId, state.selectedTaskId);
				} 
				else if ("ADDING_TASK_TITLE".equals(state.currentAction)){
					state.NewTask.setTitle(text);
					state.currentAction = "ADDING_TASK_DESCRIPTION";
					sendTelegramMessage(chatId, "Por favor, escribe la descripción de la tarea:");
					sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
				}
				else if ("ADDING_TASK_DESCRIPTION".equals(state.currentAction)){
					state.NewTask.setDescription(text);
					state.currentAction = "ADDING_TASK_ESTIMATED_HOURS";
					sendTelegramMessage(chatId, "Por favor, escribe las horas estimadas de la tarea:");
				}
				else if("ADDING_TASK_ESTIMATED_HOURS".equals(state.currentAction)){
					state.NewTask.setEstimatedHours(Double.parseDouble(text));
					showTagOptions(chatId);
				}
				else if("ADDING_TASK_REAL_TIME".equals(state.currentAction)){
					
					taskRepository.updateRealHours(state.selectedTaskId, Double.parseDouble(text));
					sendTelegramMessage(chatId, "Horas reales actualizadas.");
					state.softReset();
					listTasksForUser(chatId, state.loggedInUserId);
				}
				
				else {
					sendTelegramMessage(chatId, "Comando no reconocido. Usa /tasks para comenzar.");
				}
			}
		}
		
		else if (update.hasCallbackQuery()) {
			long chatId = update.getCallbackQuery().getMessage().getChatId();
			
			logger.debug("Handling message from Tel_ID " + chatId);
			String callbackData = update.getCallbackQuery().getData();
			logger.debug("Responding to: " + callbackData);

			UserState state = userStates.computeIfAbsent(chatId, k -> findUserOrNewState(k));

			if (callbackData.startsWith(LOGIN_USER_PREFIX)) {
				String userIdString = callbackData.substring(LOGIN_USER_PREFIX.length());
				Long userId = Long.parseLong(userIdString);
				Optional<User> user = userRepository.findById(userId);

				state.loggedInUserId = userId;
				state.userName = user.get().getName();
				userRepository.forgetChatId(chatId); // Don't allow duplicate telegramID fields
				userRepository.setChatIdForUser(userId, chatId);
				state.currentAction = "NORMAL";
				sendTelegramMessage(chatId, "Has iniciado sesión como usuario: " + user.get().getName());
				sendTelegramMessage(chatId, "Puedes cerrar sesión con '/logout' en cualquier momento");
				listTasksForUser(chatId, userId);
			}

			else if (state.loggedInUserId == null) {
				logger.debug(chatId + " seems to be logged out...");
				sendTelegramMessage(chatId, "No haz iniciado sesión actualmente, " +
						    "inicia sesión con '/login' para continuar...");
			}
			
			else if (callbackData.startsWith(TASK_PREFIX)) {
				String taskIdString = callbackData.substring(TASK_PREFIX.length());
				Long taskId = Long.parseLong(taskIdString);
				state.selectedTaskId = taskId;
				showTaskDetails(chatId, taskId);
			}
			
			else if (SHOW_COMMENTS.equals(callbackData)) {
				showComments(chatId, state.selectedTaskId);
			}
			
			else if (ADD_COMMENT.equals(callbackData)) {
				state.currentAction = "ADDING_COMMENT";
				sendTelegramMessage(chatId, "Por favor, escribe tu comentario ahora:");
				sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
			}
			else if(ADD_TASK_TITLE.equals(callbackData)){
				state.currentAction = "ADDING_TASK_TITLE";
				state.NewTask = new Task();

				sendTelegramMessage(chatId, "Por favor, escribe el título de la tarea:");
				sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
			}
			else if (callbackData.startsWith(SPRINT_SELECT_PREFIX)) {
				String sprintIdStr = callbackData.substring(SPRINT_SELECT_PREFIX.length());
				
				if (NO_SPRINT_OPTION.equals(sprintIdStr)) {
					state.NewTask.setSprintId(null);
				} else {
					Long sprintId = Long.parseLong(sprintIdStr);
					state.NewTask.setSprintId(sprintId);
				}
				
				// Procedemos a crear la tarea con el sprint seleccionado
				sendTelegramMessage(chatId, "Procesando la creación de la tarea...");
				createNewTask(chatId, state);
			}
			else if(CHANGE_STATUS.equals(callbackData)){
				sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
				showStatusOptions(chatId,state.selectedTaskId);
			}
			else if (callbackData.startsWith(STATUS_SELECT_PREFIX)) {
				// Extraer el nombre del estado de la enumeración
				String statusName = callbackData.substring(STATUS_SELECT_PREFIX.length());
				TaskStatus selectedStatus = TaskStatus.valueOf(statusName);

				if(selectedStatus == TaskStatus.COMPLETED){
					String endDate = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date());
					taskRepository.updateEndDate(state.selectedTaskId, endDate);
					sendTelegramMessage(chatId, "Fecha Final declarada como " + endDate);
					
				}
				
				// Actualizar el estado de la tarea
				taskRepository.updateStatus(state.selectedTaskId, selectedStatus.getDisplayName());
				sendTelegramMessage(chatId, "Estado actualizado a: " + selectedStatus.getDisplayName());
				
				// Mostrar los detalles actualizados
				listTasksForUser(chatId, state.loggedInUserId);
			}
			else if(callbackData.startsWith(TAG_SELECT_PREFIX)){
				String tag = callbackData.substring(TAG_SELECT_PREFIX.length());
				if(FEATURE.equals(tag) || ISSUE.equals(tag)){
					state.NewTask.setTag(tag);
					state.currentAction = "ADDING_TASK_SPRINT";
					sendTelegramMessage(chatId, "Por favor, selecciona el sprint para la tarea:");
					sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
				}

					// Obtenemos el equipo del usuario para mostrar sus sprints
					Optional<User> currentUser = userRepository.findById(state.loggedInUserId);
					if (currentUser.isPresent() && currentUser.get().getTeamId() != null) {
						showSprintsForTeam(chatId, currentUser.get().getTeamId());
					} else {
						sendTelegramMessage(chatId, "No se pudo determinar tu equipo. No se asignará ningún sprint.");
						state.NewTask.setSprintId(null);
						createNewTask(chatId, state);
					}
			}
			else if(CHANGE_REAL_HOURS.equals(callbackData)){
				sendTelegramMessage(chatId, "Por favor, escribe las horas reales de la tarea:");
				state.currentAction = "ADDING_TASK_REAL_TIME";
				sendTelegramMessage(chatId, "Puedes cancelar esta accion en todo momento con /cancel");
			}
			else {
				sendTelegramMessage(chatId, "Acción no reconocida.");
			}
		}
	}

	@Override
	public String getBotUsername() {
		return this.botUsername;
	}

	
	private void showUserList(long chatId) {
		List<User> allUsers = userRepository.findAll(100000, 0);
		if (allUsers.isEmpty()) {
			sendTelegramMessage(chatId, "No hay usuarios registrados.");
			return;
		}

		// We create an inline keyboard with one button per user
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
		Optional<Task> optTask = taskRepository.findById(taskId);
		if (optTask.isEmpty()) {
			sendTelegramMessage(chatId, "Tarea no encontrada con ID: " + taskId);
			return;
		}

		Task task = optTask.get();
		String messageText = String.format(
				"Tarea: %s\nDescripción: %s\nTag: %s\nSprint: %s\nEstado: %s\nInicio: %s\nFin: %s\nHoras Estimadas: %s\nHoras Reales: %s\n",
				task.getTitle(),
				task.getDescription(),
				task.getTag(),
				(task.getSprintId() != null) ? sprintRepository.findById(task.getSprintId()).get().getName(): "Sin sprint",
				task.getStatus(),
				task.getStartDate(),
				task.getEndDate(), 
				(task.getEstimatedHours() != null) ? task.getEstimatedHours() : "--",
				(task.getActualHours() != null) ? task.getActualHours() : "--");

		// Buttons: show comments, add new comment
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();

		rows.add(Collections.singletonList(
				createButton("Ver comentarios", SHOW_COMMENTS)));
		rows.add(Collections.singletonList(
				createButton("Agregar comentario", ADD_COMMENT)));
		rows.add(Collections.singletonList(
				createButton("Cambiar estatus", CHANGE_STATUS)));
		rows.add(Collections.singletonList(
				createButton("Colocar horas reales", CHANGE_REAL_HOURS)));

		markup.setKeyboard(rows);
		sendTelegramMessage(chatId, messageText, markup);
	}

	
	private void showComments(long chatId, Long taskId) {
		if (taskId == null) {
			sendTelegramMessage(chatId, "No has seleccionado ninguna tarea.");
			return;
		}

		List<Comment> comments = commentRepository.findByTaskId(taskId);
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
	}
	
	
	private void addNewComment(long chatId, Long taskId, Long userId, String content) {
		if (taskId == null || userId == null) {
			sendTelegramMessage(chatId, "No se puede crear comentario: Falta tarea o usuario.");
			return;
		}

		// Fetch user (to get userName) – in real code, handle optional carefully
		Optional<User> optUser = userRepository.findById(userId);
		String authorName = optUser.map(User::getName).orElse("SinNombre");

		Comment comment = new Comment();
		comment.setTaskId(taskId);
		comment.setContent(content);
		comment.setCreatorId(userId);
		comment.setCreatorName(authorName);
		comment.setCreatedAt(new Date()); // set current date/time

		commentRepository.insert(comment);

		sendTelegramMessage(chatId, "Comentario agregado correctamente.");
	}

	private void createNewTask(Long chatId, UserState state) {
		state.NewTask.setCreatorId(state.loggedInUserId);
		state.NewTask.setStartDate(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
		state.NewTask.setActualHours(null);
		state.NewTask.setStatus(TaskStatus.BACKLOG.getDisplayName());
		
		// El usuario actualmente logueado será el asignado a la tarea
		List<User> assignees = new ArrayList<>();
		Optional<User> currentUser = userRepository.findById(state.loggedInUserId);
		if (currentUser.isPresent()) {
			assignees.add(currentUser.get());
			state.NewTask.setCreatorName(currentUser.get().getName());

			if (currentUser.get().getTeamId() != null) {
            	state.NewTask.setTeamId(currentUser.get().getTeamId());
        	}
		}
		
		// Guardar la tarea en la base de datos
		Long taskId = taskRepository.insert(state.NewTask);
		
		// Agregar asignación de usuario a la tarea
		if (taskId != null) {
			taskRepository.addAssignee(taskId, state.loggedInUserId);
			sendTelegramMessage(chatId, "¡Tarea creada correctamente con ID: " + taskId + "!");
			
			// Resetear el estado y mostrar la tarea creada
			state.selectedTaskId = taskId;
			state.currentAction = "NORMAL";

		} else {
			sendTelegramMessage(chatId, "Error al crear la tarea. Por favor, intenta nuevamente.");
			state.currentAction = "NORMAL";
		}

		listTasksForUser(chatId, state.loggedInUserId);
	}

	private void eraseTask(long chatId, Long taskId) {
		if (taskId == null) {
			sendTelegramMessage(chatId, "No se puede eliminar la tarea: ID no válido.");
			return;
		}

		taskRepository.delete(taskId);
		sendTelegramMessage(chatId, "Tarea eliminada correctamente.");
		listTasksForUser(chatId, taskId);
	}

	private void showSprintsForTeam(long chatId, Long teamId) {
		List<Sprint> sprints = sprintRepository.findByTeamId(teamId);
		
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();
		
		if (sprints.isEmpty()) {
			sendTelegramMessage(chatId, "No hay sprints disponibles para tu equipo. La tarea se creará sin asignar a un sprint.");
			UserState state = userStates.get(chatId);
			state.NewTask.setSprintId(null);
			createNewTask(chatId, state);
			return;
		}
		
		// Crear un botón para cada sprint
		for (Sprint sprint : sprints) {
			InlineKeyboardButton btn = createButton(
					sprint.getName() ,
					SPRINT_SELECT_PREFIX + sprint.getId());
			rows.add(Collections.singletonList(btn));
		}
		
		// Opción para no asignar sprint
		InlineKeyboardButton noSprintBtn = createButton("Sin sprint", SPRINT_SELECT_PREFIX + NO_SPRINT_OPTION);
		rows.add(Collections.singletonList(noSprintBtn));
		
		markup.setKeyboard(rows);
		sendTelegramMessage(chatId, "Selecciona el sprint para esta tarea:", markup);
	}

	private void showTagOptions(long chatId) {
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();
		
		// Crear botones para cada opción de tag
		InlineKeyboardButton featureBtn = createButton(FEATURE, TAG_SELECT_PREFIX + FEATURE);
		InlineKeyboardButton issueBtn = createButton(ISSUE, TAG_SELECT_PREFIX + ISSUE);
		
		rows.add(Collections.singletonList(featureBtn));
		rows.add(Collections.singletonList(issueBtn));
		
		markup.setKeyboard(rows);
		sendTelegramMessage(chatId, "Selecciona el tag para la tarea:", markup);

	}

	private void showStatusOptions(long chatId,long taskId){
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();
		
		for (TaskStatus status : TaskStatus.values()) {
			InlineKeyboardButton button = createButton(
				status.getDisplayName(),
				STATUS_SELECT_PREFIX + status.name()
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
		button.setCallbackData(callbackData);
		return button;
	}

	private void sendTelegramMessage(long chatId, String text) {
		sendTelegramMessage(chatId, text, null);
	}

	private void sendTelegramMessage(long chatId, String text, InlineKeyboardMarkup markup) {
		SendMessage message = new SendMessage();
		message.setChatId(chatId);
		message.setText(text);
		if (markup != null) {
			message.setReplyMarkup(markup);
		}
		try {
			execute(message);
		} catch (TelegramApiException e) {
			logger.error("Error sending Telegram message: " + e.getMessage(), e);
		}
	}

	@Override
	public String getBotToken() {
		return botToken;
	}

	// UserState helper class
	private static class UserState {
		// TODO: Just use User and Task objects instead of sparse data
		Long loggedInUserId; // Which user is "logged in"
		String userName;
		Long selectedTaskId; // Which task the user is viewing
		String currentAction; // e.g. "NORMAL", "ADDING_COMMENT"
		Task NewTask; 

		UserState() {
			reset();
		}

		void reset() {
			this.loggedInUserId = null;
			this.userName = null;
			softReset();
			
		}

		void softReset(){
			this.selectedTaskId = null;
			this.currentAction = "NORMAL";
			this.NewTask = null;
		}
	}

}
