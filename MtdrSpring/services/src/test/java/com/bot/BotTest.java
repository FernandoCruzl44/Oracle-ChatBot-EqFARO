package com.bot;

import org.telegram.telegrambots.meta.api.objects.User;
import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.controller.GeminiController;
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
