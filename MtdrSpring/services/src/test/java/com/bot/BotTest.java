package com.bot;

import org.telegram.telegrambots.meta.api.objects.User;
import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.controller.BotController.TaskStatus;
import com.springboot.MyTodoList.controller.GeminiController;
import com.springboot.MyTodoList.model.*;
import com.springboot.MyTodoList.repository.*;
import com.springboot.MyTodoList.service.AuthenticationService;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Chat;
import org.telegram.telegrambots.meta.api.objects.Message;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.CallbackQuery;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

public class BotTest {

	@Mock
	private Jdbi mockJdbi;
	@Mock
	private UserRepository mockUserRepository;
	@Mock
	private TaskRepository mockTaskRepository;
	@Mock
	private CommentRepository mockCommentRepository;
	@Mock
	private SprintRepository mockSprintRepository;
	@Mock
	private KpiRepository mockKpiRepository;
	@Mock
	private AuthenticationService mockAuthService;
	@Mock
	private GeminiController mockGeminiController;

	@Mock
	private Update mockUpdate;
	@Mock
	private Message mockMessage;
	@Mock
	private Chat mockChat;
	@Mock
	private User mockTelegramUser;

	private BotController botController;

	private static final String FAKE_TOKEN = "fake-token";
	private static final String FAKE_USERNAME = "fake_bot";
	private static final long TEST_CHAT_ID = 12345L;
	private static final long TEST_TELEGRAM_USER_ID = 98765L;
	private static final long TEST_APP_USER_ID = 1L;
	private static final String TEST_USER_NAME = "Test User";

	@BeforeEach
	void setUp() {
		MockitoAnnotations.openMocks(this);

		when(mockJdbi.onDemand(UserRepository.class)).thenReturn(mockUserRepository);
		when(mockJdbi.onDemand(TaskRepository.class)).thenReturn(mockTaskRepository);
		when(mockJdbi.onDemand(CommentRepository.class)).thenReturn(mockCommentRepository);
		when(mockJdbi.onDemand(SprintRepository.class)).thenReturn(mockSprintRepository);
		when(mockJdbi.onDemand(KpiRepository.class)).thenReturn(mockKpiRepository);

		botController = spy(new BotController(
				FAKE_TOKEN,
				FAKE_USERNAME,
				mockJdbi,
				mockAuthService,
				mockGeminiController));
		try {
			doReturn(null).when(botController).execute(any(SendMessage.class));
		} catch (Exception e) {
			System.err.println("Warning: Could not stub execute(SendMessage): " + e.getMessage());
		}

		when(mockUpdate.hasMessage()).thenReturn(true);
		when(mockUpdate.getMessage()).thenReturn(mockMessage);
		when(mockUpdate.hasCallbackQuery()).thenReturn(false);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(mockMessage.getChat()).thenReturn(mockChat);
		when(mockChat.getId()).thenReturn(TEST_CHAT_ID);
		when(mockMessage.getFrom()).thenReturn(mockTelegramUser);
		when(mockTelegramUser.getId()).thenReturn(TEST_TELEGRAM_USER_ID);
		when(mockMessage.hasText()).thenReturn(true);
		when(mockUserRepository.findByChatId(TEST_CHAT_ID)).thenReturn(Optional.empty());
	}

	private void setupLoggedInState() {
		com.springboot.MyTodoList.model.User loggedInAppUser = new com.springboot.MyTodoList.model.User();
		loggedInAppUser.setId(TEST_APP_USER_ID);
		loggedInAppUser.setName(TEST_USER_NAME);
		when(mockUserRepository.findByChatId(TEST_CHAT_ID)).thenReturn(Optional.of(loggedInAppUser));
	}

	@Test
	void handleTextMessage_StartCommand_WhenLoggedIn_ShouldListTasks() throws Exception {
		// Este test verifica que cuando un usuario está logueado y envía el comando
		// /start,
		// se recuperan y se listan sus tareas asignadas.
		setupLoggedInState();
		when(mockMessage.getText()).thenReturn("/start");

		botController.onUpdateReceived(mockUpdate);

		verify(mockUserRepository).findByChatId(TEST_CHAT_ID);
		verify(mockTaskRepository).findTasksAssignedToUser(TEST_APP_USER_ID);
		verify(botController, atLeast(1)).execute(any(SendMessage.class));
	}

	@Test
	void handleCallback_AddTaskCommand_WhenLoggedIn_ShouldPromptForTitle() throws Exception {
		// simulate logged-in
		setupLoggedInState();

		// switch to callback path
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		// use the literal callback string
		// TODO: set as public and use that instead
		when(cq.getData()).thenReturn("addTaskTitle");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(2)).execute(cap.capture());

		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(0).getText().contains("Por favor, escribe el título de la tarea"));
		assertTrue(calls.get(1).getText().contains("Puedes cancelar esta accion"));
	}

	@Test
	void handleCallback_ShowFloatingTasks_WhenLoggedIn_ShouldListTeamTasks() throws Exception {
		setupLoggedInState();

		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("showFloatingTasks");

		// mock the database responses for the team
		com.springboot.MyTodoList.model.User appUser = new com.springboot.MyTodoList.model.User();
		appUser.setId(TEST_APP_USER_ID);
		appUser.setTeamId(99L);
		appUser.setTeamName("Team Rocket");
		when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.of(appUser));

		// Add tasks to return as part of the project
		Task t1 = new Task();
		t1.setId(1L);
		t1.setTitle("Alpha");
		Task t2 = new Task();
		t2.setId(2L);
		t2.setTitle("Beta");
		when(mockTaskRepository.findTasksByTeamId(99L))
				.thenReturn(Arrays.asList(t1, t2));

		botController.onUpdateReceived(mockUpdate);

		verify(mockTaskRepository).findTasksByTeamId(99L);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		// two sends: the list + the “volver” hint
		verify(botController, times(2)).execute(cap.capture());

		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(0).getText().contains("Todas las tareas en el equipo Team Rocket"));
		assertNotNull(calls.get(0).getReplyMarkup(), "should include buttons for each task");
		assertTrue(calls.get(1).getText().contains("Puedes volver con /tasks"));
	}

	@Test
	void handleTextMessage_LogoutCommand_WhenLoggedIn_ShouldForgetChatIdAndResetState() throws Exception {
		// Este test verifica que cuando un usuario está logueado y envía el comando
		// /logout,
		// se elimina su chatId de la base de datos y se restablece el estado de la
		// aplicación,
		// impidiendo que se listen tareas hasta que vuelva a iniciar sesión.
		setupLoggedInState();
		when(mockMessage.getText()).thenReturn("/logout");
		ArgumentCaptor<SendMessage> messageCaptor = ArgumentCaptor.forClass(SendMessage.class);

		botController.onUpdateReceived(mockUpdate);

		verify(mockUserRepository).forgetChatId(TEST_CHAT_ID);
		verify(botController).execute(messageCaptor.capture());
		assertTrue(messageCaptor.getValue().getText().contains("Terminando sesión"));

		reset(mockUserRepository, mockTaskRepository);
		when(mockUserRepository.findByChatId(TEST_CHAT_ID)).thenReturn(Optional.empty());
		when(mockJdbi.onDemand(UserRepository.class)).thenReturn(mockUserRepository);
		when(mockMessage.getText()).thenReturn("/tasks");

		botController.onUpdateReceived(mockUpdate);

		verify(mockTaskRepository, never()).findTasksAssignedToUser(anyLong());
		verify(botController, times(2)).execute(messageCaptor.capture());
		assertTrue(messageCaptor.getValue().getText().contains("No hay sesión iniciada"));
	}

	@Test
	void handleText_WhoAmI_WhenLoggedIn_ShouldReturnSession() throws Exception {
		setupLoggedInState();
		when(mockMessage.getText()).thenReturn("/whoami");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Sesión de " + TEST_USER_NAME));
	}

	@Test
	void handleText_WhoAmI_WhenNotLoggedIn_ShouldPromptLogin() throws Exception {
		when(mockUserRepository.findByChatId(TEST_CHAT_ID)).thenReturn(Optional.empty());
		when(mockMessage.getText()).thenReturn("/whoami");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("No has iniciado sesión"));
	}

	@Test
	void handleText_Kpis_WhenLoggedIn_ShouldShowKpis() throws Exception {
		setupLoggedInState();
		when(mockMessage.getText()).thenReturn("/kpis");

		// stub user → team
		com.springboot.MyTodoList.model.User appUser = new com.springboot.MyTodoList.model.User();
		appUser.setId(TEST_APP_USER_ID);
		appUser.setName(TEST_USER_NAME);
		appUser.setTeamId(55L);
		when(mockUserRepository.findById(TEST_APP_USER_ID))
				.thenReturn(Optional.of(appUser));

		// stub one sprint
		Sprint spr = new Sprint();
		spr.setId(10L);
		spr.setName("Sprint10");
		when(mockSprintRepository.findByTeamId(55L))
				.thenReturn(List.of(spr));

		// stub one KPI
		Kpi k1 = new Kpi();
		k1.setMemberName("Alice");
		k1.setCompletedTasks(3);
		k1.setTotalActualHours(12.5);
		when(mockKpiRepository.getCompletionRateByMemberAndSprint(10L))
				.thenReturn(List.of(k1));

		botController.onUpdateReceived(mockUpdate);

		// first → login confirmation, second → Evaluando sprint, third → volver hint
		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(3)).execute(cap.capture());
		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(1).getText().contains("Evaluando mas reciente sprint: Sprint10"));
		assertTrue(calls.get(2).getText().contains("Puedes volver con /tasks"));
	}

	@Test
	void handleText_Kpis_WhenNotLoggedIn_ShouldPromptLogin() throws Exception {
		when(mockUserRepository.findByChatId(TEST_CHAT_ID)).thenReturn(Optional.empty());
		when(mockMessage.getText()).thenReturn("/kpis");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("No hay sesión iniciada"));
	}

	@Test
	void handleCallback_ShowTaskDetails_WhenLoggedIn_ShouldDisplayInfo() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("task_5");

		// stub Task
		Task t = new Task();
		t.setId(5L);
		t.setTitle("T5");
		t.setDescription("Desc");
		t.setStatus(TaskStatus.BACKLOG.getDisplayName());
		t.setSprintId(null);
		t.setStartDate("2025-01-01");
		t.setEndDate("2025-01-02");
		t.setEstimatedHours(2.0);
		t.setActualHours(1.0);
		when(mockTaskRepository.findById(5L)).thenReturn(Optional.of(t));
		when(mockTaskRepository.findAssigneesByTaskId(5L))
				.thenReturn(List.of(new com.springboot.MyTodoList.model.User()));

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(3)).execute(cap.capture());
		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(0).getText().contains("Tarea: T5"));
		// Se hacen tres llamadas en el fondo, la ultima es la de volver, me imagino que
		// la segunda es el markup?
		assertTrue(calls.get(2).getText().contains("Puedes volver con /tasks"));
	}

	@Test
	void handleCallback_ChangeStatusPrompt_WhenLoggedIn_ShouldShowOptions() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		// 1) select the task
		CallbackQuery cq1 = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq1);
		when(cq1.getMessage()).thenReturn(mockMessage);
		when(cq1.getData()).thenReturn("task_5");
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(mockTaskRepository.findById(5L))
				.thenReturn(Optional.of(new Task()));
		when(mockTaskRepository.findAssigneesByTaskId(5L))
				.thenReturn(List.of(new com.springboot.MyTodoList.model.User()));
		botController.onUpdateReceived(mockUpdate);

		reset(botController);

		// 2) click “change status”
		CallbackQuery cq2 = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq2);
		when(cq2.getMessage()).thenReturn(mockMessage);
		when(cq2.getData()).thenReturn("change_status");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(2)).execute(cap.capture());
		assertTrue(cap.getValue().getText()
				.contains("Selecciona el nuevo estado para la tarea"));
	}

	@Test
	void handleCallback_ChangeRealHoursPrompt_WhenLoggedIn_ShouldRequestHours() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		// stub state.selectedTaskId via first callback
		CallbackQuery cq1 = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq1);
		when(cq1.getMessage()).thenReturn(mockMessage);
		when(cq1.getData()).thenReturn("task_7");
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(mockTaskRepository.findById(7L))
				.thenReturn(Optional.of(new Task()));
		when(mockTaskRepository.findAssigneesByTaskId(7L))
				.thenReturn(List.of(new com.springboot.MyTodoList.model.User()));
		botController.onUpdateReceived(mockUpdate);

		reset(botController);

		// now click “change real hours”
		CallbackQuery cq2 = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq2);
		when(cq2.getMessage()).thenReturn(mockMessage);
		when(cq2.getData()).thenReturn("real_hours");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(2)).execute(cap.capture());
		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(0).getText()
				.contains("Por favor, escribe las horas reales"));
		assertTrue(calls.get(1).getText()
				.contains("Puedes cancelar esta accion"));
	}

	@Test
	void handleText_ChangeRealHoursInput_ShouldUpdateAndList() throws Exception {
		setupLoggedInState();

		// Directly access and set the state
		BotController.UserState state = botController.userStates.computeIfAbsent(
				TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = 7L;
		state.currentAction = "ADDING_TASK_REAL_TIME";

		when(mockMessage.getText()).thenReturn("3.5");
		when(mockTaskRepository.findTasksAssignedToUser(TEST_APP_USER_ID))
				.thenReturn(Collections.emptyList());

		botController.onUpdateReceived(mockUpdate);

		verify(mockTaskRepository).updateRealHours(7L, 3.5);
		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(3)).execute(cap.capture());

		assertTrue(cap.getAllValues().get(0).getText()
				.contains("Horas reales actualizadas"));
	}

	@Test
	void handleCallback_AddCommentPrompt_WhenLoggedIn_ShouldRequestContent() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		// stub already-selected task
		CallbackQuery cq1 = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq1);
		when(cq1.getMessage()).thenReturn(mockMessage);
		when(cq1.getData()).thenReturn("task_9");
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(mockTaskRepository.findById(9L))
				.thenReturn(Optional.of(new Task()));
		when(mockTaskRepository.findAssigneesByTaskId(9L))
				.thenReturn(List.of(new com.springboot.MyTodoList.model.User()));
		botController.onUpdateReceived(mockUpdate);

		reset(botController);

		// now click “add comment”
		CallbackQuery cq2 = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq2);
		when(cq2.getMessage()).thenReturn(mockMessage);
		when(cq2.getData()).thenReturn("addComment");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(2)).execute(cap.capture());
		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(0).getText()
				.contains("Por favor, escribe tu comentario ahora"));
	}

	@Test
	void handleText_AddCommentInput_ShouldInsertAndDetail() throws Exception {
		setupLoggedInState();

		// Directly access and set the state
		BotController.UserState state = botController.userStates.computeIfAbsent(
				TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = 9L;
		state.currentAction = "ADDING_COMMENT";

		when(mockMessage.getText()).thenReturn("Looks great!");

		com.springboot.MyTodoList.model.User u = new com.springboot.MyTodoList.model.User();
		u.setName("Tester");
		when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.of(u));
		when(mockTaskRepository.findById(9L)).thenReturn(Optional.of(new Task()));
		when(mockTaskRepository.findAssigneesByTaskId(9L)).thenReturn(List.of(u));

		botController.onUpdateReceived(mockUpdate);

		verify(mockCommentRepository).insert(any());
		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(2)).execute(cap.capture());

		assertTrue(cap.getAllValues().get(0).getText()
				.contains("Comentario agregado correctamente"));
	}

	//Aqui termina el "Happy path"

	@Test
	void handleCallback_LoginWithInvalidUserId_ShouldHandleNumberFormatException() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		// Callback con ID inválido (no numérico)
		when(cq.getData()).thenReturn("login_user_invalid_id");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Error interno (formato de ID de usuario inválido)"));
	}

	// @Test
	// void handleCallback_LoginWithValidIdButUserNotFound_ShouldHandleGracefully() throws Exception {
	// 	setupLoggedInState();
	// 	when(mockUpdate.hasMessage()).thenReturn(false);
	// 	when(mockUpdate.hasCallbackQuery()).thenReturn(true);

	// 	CallbackQuery cq = mock(CallbackQuery.class);
	// 	when(mockUpdate.getCallbackQuery()).thenReturn(cq);
	// 	when(cq.getMessage()).thenReturn(mockMessage);
	// 	when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
	// 	when(cq.getData()).thenReturn("login_user_999");

	// 	// Usuario no existe en base de datos
	// 	when(mockUserRepository.findById(999L)).thenReturn(Optional.empty());

	// 	botController.onUpdateReceived(mockUpdate);

	// 	ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
	// 	verify(botController).execute(cap.capture());
	// 	assertTrue(cap.getValue().getText().contains("Error al iniciar sesión: Usuario no encontrado"));
	// }

	@Test
	void handleCallback_TaskWithInvalidTaskId_ShouldHandleNumberFormatException() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		// Task ID inválido
		when(cq.getData()).thenReturn("task_not_a_number");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Error interno (formato de ID de tarea inválido)"));
	}

	@Test
	void handleCallback_SelfAssignWithInvalidTaskId_ShouldCatchException() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("self_assign_invalid_id");

		botController.onUpdateReceived(mockUpdate);

		// Debería capturar la excepción y no crashear
		verify(mockTaskRepository, never()).addAssignee(anyLong(), anyLong());
	}

	@Test
	void handleCallback_SelfAssignWhenAddAssigneeFails_ShouldHandleGracefully() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("self_assign_5");

		// addAssignee retorna 0 (fallo)
		when(mockTaskRepository.addAssignee(5L, TEST_APP_USER_ID)).thenReturn(0);

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		// Debe verificar que NO se envíe mensaje de éxito
		assertFalse(cap.getValue().getText().contains("Tarea asignada con éxito"));
	}

	@Test
	void handleCallback_ShowCommentsWithoutSelectedTask_ShouldPromptTaskSelection() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("showComments");

		// Simular estado sin tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = null; // Sin tarea seleccionada

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Por favor, selecciona una tarea primero"));
	}

	@Test
	void handleCallback_ShowFloatingTasksWhenUserNotFound_ShouldHandleGracefully() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("showFloatingTasks");

		// Usuario no encontrado en base de datos
		when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.empty());

		botController.onUpdateReceived(mockUpdate);

		// No debería crashear, método debería terminar temprano
		verify(mockTaskRepository, never()).findTasksByTeamId(anyLong());
	}

	@Test
	void handleCallback_AddCommentWithoutSelectedTask_ShouldPromptTaskSelection() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("addComment");

		// Estado sin tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Por favor, selecciona una tarea primero"));
	}

	@Test
	void handleCallback_SprintSelectInWrongState_ShouldResetAndWarn() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("sprint_select_5");

		// Estado incorrecto - no está agregando tarea
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.currentAction = "NORMAL"; // No en estado de agregar tarea
		state.NewTask = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Acción inesperada. Usa /cancel para reiniciar"));
	}

	@Test
	void handleCallback_SprintSelectWithInvalidSprintId_ShouldHandleNumberFormatException() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("sprint_select_invalid_id");

		// Estado correcto para agregar tarea
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.currentAction = "ADDING_TASK_SPRINT";
		state.NewTask = new Task();

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Error interno (formato de ID de sprint inválido)"));
	}

	@Test
	void handleCallback_ChangeStatusWithoutSelectedTask_ShouldPromptTaskSelection() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("change_status");

		// Sin tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Por favor, selecciona una tarea primero"));
	}

	@Test
	void handleCallback_StatusSelectWithoutSelectedTask_ShouldResetState() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("status_select_COMPLETED");

		// Sin tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Error: No hay tarea seleccionada para cambiar estado"));
	}

	@Test
	void handleCallback_StatusSelectWithInvalidStatus_ShouldHandleIllegalArgumentException() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("status_select_INVALID_STATUS");

		// Con tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = 5L;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Error interno (nombre de estado inválido)"));
	}

	@Test
	void handleCallback_TagSelectInWrongState_ShouldResetAndWarn() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("tag_select_FEATURE");

		// Estado incorrecto
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.currentAction = "NORMAL"; // No agregando tarea
		state.NewTask = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Acción inesperada. Usa /cancel para reiniciar"));
	}

	// @Test
	// void handleCallback_TagSelectWithInvalidTag_ShouldRejectAndShowOptions() throws Exception {
	// 	setupLoggedInState();
	// 	when(mockUpdate.hasMessage()).thenReturn(false);
	// 	when(mockUpdate.hasCallbackQuery()).thenReturn(true);

	// 	CallbackQuery cq = mock(CallbackQuery.class);
	// 	when(mockUpdate.getCallbackQuery()).thenReturn(cq);
	// 	when(cq.getMessage()).thenReturn(mockMessage);
	// 	when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
	// 	when(cq.getData()).thenReturn("tag_select_INVALID_TAG");

	// 	// Estado correcto para agregar tarea
	// 	BotController.UserState state = botController.userStates.computeIfAbsent(
	// 		TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
	// 	state.loggedInUserId = TEST_APP_USER_ID;
	// 	state.currentAction = "ADDING_TASK_DESCRIPTION";
	// 	state.NewTask = new Task();

	// 	botController.onUpdateReceived(mockUpdate);

	// 	ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
	// 	verify(botController).execute(cap.capture());
	// 	assertTrue(cap.getValue().getText().contains("Tag inválido seleccionado"));
	// }

	// @Test
	// void handleCallback_TagSelectWhenUserHasNoTeam_ShouldHandleGracefully() throws Exception {
	// 	setupLoggedInState();
	// 	when(mockUpdate.hasMessage()).thenReturn(false);
	// 	when(mockUpdate.hasCallbackQuery()).thenReturn(true);

	// 	CallbackQuery cq = mock(CallbackQuery.class);
	// 	when(mockUpdate.getCallbackQuery()).thenReturn(cq);
	// 	when(cq.getMessage()).thenReturn(mockMessage);
	// 	when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
	// 	when(cq.getData()).thenReturn("tag_select_FEATURE");

	// 	// Estado correcto pero usuario sin equipo
	// 	BotController.UserState state = botController.userStates.computeIfAbsent(
	// 		TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
	// 	state.loggedInUserId = TEST_APP_USER_ID;
	// 	state.currentAction = "ADDING_TASK_SPRINT";
	// 	state.NewTask = new Task();

	// 	// Usuario sin teamId
	// 	com.springboot.MyTodoList.model.User userWithoutTeam = new com.springboot.MyTodoList.model.User();
	// 	userWithoutTeam.setId(TEST_APP_USER_ID);
	// 	userWithoutTeam.setTeamId(null);
	// 	when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.of(userWithoutTeam));

	// 	botController.onUpdateReceived(mockUpdate);

	// 	ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
	// 	verify(botController, times(2)).execute(cap.capture());
	// 	List<SendMessage> calls = cap.getAllValues();
	// 	assertTrue(calls.get(1).getText().contains("No se pudo determinar tu equipo"));
	// }

	@Test
	void handleCallback_ChangeRealHoursWithoutSelectedTask_ShouldPromptTaskSelection() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("real_hours");

		// Sin tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Por favor, selecciona una tarea primero"));
	}

	@Test
	void handleCallback_GeminiDivideTaskWithoutSelectedTask_ShouldInformNoTask() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("gemini_divide_task");

		// Sin tarea seleccionada
		BotController.UserState state = botController.userStates.computeIfAbsent(
			TEST_CHAT_ID, id -> botController.findUserOrNewState(id));
		state.loggedInUserId = TEST_APP_USER_ID;
		state.selectedTaskId = null;

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController, times(2)).execute(cap.capture());
		List<SendMessage> calls = cap.getAllValues();
		assertTrue(calls.get(0).getText().contains("No hay tarea seleccionada"));
	}

	@Test
	void handleCallback_UnrecognizedCallback_ShouldLogAndInformUser() throws Exception {
		setupLoggedInState();
		when(mockUpdate.hasMessage()).thenReturn(false);
		when(mockUpdate.hasCallbackQuery()).thenReturn(true);

		CallbackQuery cq = mock(CallbackQuery.class);
		when(mockUpdate.getCallbackQuery()).thenReturn(cq);
		when(cq.getMessage()).thenReturn(mockMessage);
		when(mockMessage.getChatId()).thenReturn(TEST_CHAT_ID);
		when(cq.getData()).thenReturn("unknown_callback_action");

		botController.onUpdateReceived(mockUpdate);

		ArgumentCaptor<SendMessage> cap = ArgumentCaptor.forClass(SendMessage.class);
		verify(botController).execute(cap.capture());
		assertTrue(cap.getValue().getText().contains("Acción no reconocida"));
	}

}

// Conclusión: Estos tests aseguran que el bot maneja correctamente los comandos
// /start y /logout, y sirven como el
// punto de partida para agregar más pruebas unitarias para otros comandos y
// funcionalidades del bot.
