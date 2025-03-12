package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Comment;

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

/**
 * Example repositories with the calls we use:
 *
 * interface UserRepository {
 * List<User> findAll();
 * Optional<User> findById(Long id);
 * }
 *
 * interface TaskRepository {
 * List<Task> findByAssignees_Id(Long userId); // Example: tasks assigned to a
 * user
 * Optional<Task> findById(Long id);
 * }
 *
 * interface CommentRepository {
 * List<Comment> findByTaskId(Long taskId);
 * void save(Comment comment);
 * }
 */

public class BotController extends TelegramLongPollingBot {
	
	private static final Logger logger = LoggerFactory.getLogger(BotController.class);

	private final UserRepository userRepository;
	private final TaskRepository taskRepository;
	private final CommentRepository commentRepository;

	// Identifiers for callback data
	private static final String LOGIN_USER_PREFIX = "login_";
	private static final String TASK_PREFIX = "task_";
	private static final String SHOW_COMMENTS = "showComments";
	private static final String ADD_COMMENT = "addComment";

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

		logger.info("Bot initialized with username: " + botUsername);
	}

	@Override
	public void onUpdateReceived(Update update) {
		// If it's a text message
		if (update.hasMessage() && update.getMessage().hasText()) {
			long chatId = update.getMessage().getChatId();
			String text = update.getMessage().getText();

			// Make sure user has a state entry
			UserState state = userStates.computeIfAbsent(chatId, k -> new UserState());

			// Basic commands
			if ("/start".equalsIgnoreCase(text)) {
				// Reset and show the "login" flow
				state.reset();
				showUserList(chatId);
			} else {
				// If the user is in the middle of adding a comment, process that
				if ("ADDING_COMMENT".equals(state.currentAction)) {
					addNewComment(chatId, state.selectedTaskId, state.loggedInUserId, text);
					// Return to normal
					state.currentAction = "NORMAL";
					// Show the task's comments again
					showComments(chatId, state.selectedTaskId);
				} else {
					// Any other text input can be ignored or handled as needed
					sendTelegramMessage(chatId, "Comando no reconocido. Usa /start para comenzar.");
				}
			}
		}
		// If it's a callback query (button press)
		else if (update.hasCallbackQuery()) {
			long chatId = update.getCallbackQuery().getMessage().getChatId();
			String callbackData = update.getCallbackQuery().getData();

			UserState state = userStates.computeIfAbsent(chatId, k -> new UserState());

			// 1) Handle "login_X" prefix -> user chooses who they are
			if (callbackData.startsWith(LOGIN_USER_PREFIX)) {
				String userIdString = callbackData.substring(LOGIN_USER_PREFIX.length());
				Long userId = Long.parseLong(userIdString);
				state.loggedInUserId = userId;
				state.currentAction = "NORMAL";
				sendTelegramMessage(chatId, "Has iniciado sesión como usuario ID: " + userIdString);
				listTasksForUser(chatId, userId);
			}
			// 2) Handle "task_X" prefix -> user wants to see a specific task
			else if (callbackData.startsWith(TASK_PREFIX)) {
				String taskIdString = callbackData.substring(TASK_PREFIX.length());
				Long taskId = Long.parseLong(taskIdString);
				state.selectedTaskId = taskId;
				showTaskDetails(chatId, taskId);
			}
			// 3) Show comments of the currently selected task
			else if (SHOW_COMMENTS.equals(callbackData)) {
				showComments(chatId, state.selectedTaskId);
			}
			// 4) Add comment flow
			else if (ADD_COMMENT.equals(callbackData)) {
				state.currentAction = "ADDING_COMMENT";
				promptForComment(chatId);
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
					user.getName() + " (ID: " + user.getId() + ")",
					LOGIN_USER_PREFIX + user.getId());
			rows.add(Collections.singletonList(btn));
		}
		markup.setKeyboard(rows);

		sendTelegramMessage(chatId, "Selecciona tu usuario:", markup);
	}

	
	private void listTasksForUser(long chatId, Long userId) {
		List<Task> tasks = taskRepository.findTasksAssignedToUser(userId);
		if (tasks.isEmpty()) {
			sendTelegramMessage(chatId, "No tienes tareas asignadas.");
			return;
		}

		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();

		for (Task task : tasks) {
			InlineKeyboardButton btn = createButton(
					task.getTitle() + " [ID: " + task.getId() + "]",
					TASK_PREFIX + task.getId());
			rows.add(Collections.singletonList(btn));
		}

		markup.setKeyboard(rows);
		sendTelegramMessage(chatId, "Estas son tus tareas asignadas:", markup);
	}


	private void showTaskDetails(long chatId, Long taskId) {
		Optional<Task> optTask = taskRepository.findById(taskId);
		if (optTask.isEmpty()) {
			sendTelegramMessage(chatId, "Tarea no encontrada con ID: " + taskId);
			return;
		}

		Task task = optTask.get();
		String messageText = String.format(
				"Tarea: %s\nDescripción: %s\nEstado: %s\nInicio: %s\nFin: %s\n",
				task.getTitle(),
				task.getDescription(),
				task.getStatus(),
				task.getStartDate(),
				task.getEndDate());

		// Buttons: show comments, add new comment
		InlineKeyboardMarkup markup = new InlineKeyboardMarkup();
		List<List<InlineKeyboardButton>> rows = new ArrayList<>();

		rows.add(Collections.singletonList(
				createButton("Ver comentarios", SHOW_COMMENTS)));
		rows.add(Collections.singletonList(
				createButton("Agregar comentario", ADD_COMMENT)));

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

	
	private void promptForComment(long chatId) {
		sendTelegramMessage(chatId, "Por favor, escribe tu comentario ahora:");
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

	// -------------- UTILITY METHODS --------------

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

	// -------------- USER STATE CLASS --------------
	private static class UserState {
		Long loggedInUserId; // Which user is "logged in"
		Long selectedTaskId; // Which task the user is viewing
		String currentAction; // e.g. "NORMAL", "ADDING_COMMENT"

		UserState() {
			reset();
		}

		void reset() {
			this.loggedInUserId = null;
			this.selectedTaskId = null;
			this.currentAction = "NORMAL";
		}
	}
}
