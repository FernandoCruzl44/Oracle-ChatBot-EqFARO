package com.bot;

import org.telegram.telegrambots.meta.api.objects.User;
import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.controller.GeminiController;
import com.springboot.MyTodoList.model.Task;
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
		Task t1 = new Task(); t1.setId(1L); t1.setTitle("Alpha");
		Task t2 = new Task(); t2.setId(2L); t2.setTitle("Beta");
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
}

// Conclusión: Estos tests aseguran que el bot maneja correctamente los comandos
// /start y /logout, y sirven como el
// punto de partida para agregar más pruebas unitarias para otros comandos y
// funcionalidades del bot.
