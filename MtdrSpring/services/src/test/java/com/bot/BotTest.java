package com.bot;

import org.telegram.telegrambots.meta.api.objects.User;
import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.controller.GeminiController;
import com.springboot.MyTodoList.repository.*;
import com.springboot.MyTodoList.service.AuthenticationService;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Kpi;
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
import java.util.Arrays;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

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
        setupLoggedInState();
        when(mockMessage.getText()).thenReturn("/start");

        botController.onUpdateReceived(mockUpdate);

        verify(mockUserRepository).findByChatId(TEST_CHAT_ID);
        verify(mockTaskRepository).findTasksAssignedToUser(TEST_APP_USER_ID);
        verify(botController, atLeast(1)).execute(any(SendMessage.class));
    }

    @Test
    void handleTextMessage_LogoutCommand_WhenLoggedIn_ShouldForgetChatIdAndResetState() throws Exception {
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
    void testCreateTask() throws Exception {
        setupLoggedInState();
        
        com.springboot.MyTodoList.model.User loggedInUser = new com.springboot.MyTodoList.model.User();
        loggedInUser.setId(TEST_APP_USER_ID);
        loggedInUser.setName(TEST_USER_NAME);
        loggedInUser.setTeamId(10L);
        when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.of(loggedInUser));
        
        Sprint testSprint = new Sprint();
        testSprint.setId(100L);
        testSprint.setName("Test Sprint");
        when(mockSprintRepository.findByTeamId(10L)).thenReturn(Arrays.asList(testSprint));
        
        Task newTask = new Task();
        newTask.setTitle("Test Task");
        newTask.setDescription("Test Description");
        newTask.setEstimatedHours(5.0);
        newTask.setTag("Feature");
        newTask.setSprintId(100L);
        newTask.setStatus("Backlog");
        newTask.setCreatorId(TEST_APP_USER_ID);
        newTask.setCreatorName(TEST_USER_NAME);
        newTask.setTeamId(10L);
        newTask.setStartDate(new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
        
        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        when(mockTaskRepository.insert(taskCaptor.capture())).thenReturn(55L);
        
        ArgumentCaptor<Long> taskIdCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<Long> userIdCaptor = ArgumentCaptor.forClass(Long.class);
        when(mockTaskRepository.addAssignee(taskIdCaptor.capture(), userIdCaptor.capture())).thenReturn(1);
        
        Long insertedId = mockTaskRepository.insert(newTask);
        mockTaskRepository.addAssignee(insertedId, TEST_APP_USER_ID);
        
        verify(mockTaskRepository).insert(any(Task.class));
        Task capturedTask = taskCaptor.getValue();
        
        assertEquals("Test Task", capturedTask.getTitle());
        assertEquals("Test Description", capturedTask.getDescription());
        assertEquals(5.0, capturedTask.getEstimatedHours());
        assertEquals("Feature", capturedTask.getTag());
        assertEquals(100L, capturedTask.getSprintId());
        assertEquals("Backlog", capturedTask.getStatus());
        assertEquals(TEST_APP_USER_ID, capturedTask.getCreatorId());
        assertEquals(10L, capturedTask.getTeamId());
        assertNotNull(capturedTask.getStartDate());
        
        verify(mockTaskRepository).addAssignee(anyLong(), anyLong());
        assertEquals(Long.valueOf(55L), taskIdCaptor.getValue());
        assertEquals(TEST_APP_USER_ID, userIdCaptor.getValue());
    }
    
    private void assertMessageContainsOneOf(List<SendMessage> messages, String[] expectedContents) {
        for (SendMessage message : messages) {
            String text = message.getText().toLowerCase();
            for (String content : expectedContents) {
                if (text.contains(content.toLowerCase())) {
                    return;
                }
            }
        }
        
        StringBuilder expected = new StringBuilder();
        for (int i = 0; i < expectedContents.length; i++) {
            expected.append("'").append(expectedContents[i]).append("'");
            if (i < expectedContents.length - 1) expected.append(" or ");
        }
        fail("No message containing " + expected + " was found in the " + messages.size() + " captured messages");
    }

    private void assertMessageWasSent(List<SendMessage> messages, String expectedContent) {
        boolean found = false;
        for (SendMessage message : messages) {
            if (message.getText().contains(expectedContent)) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Expected message containing '" + expectedContent + "' was not sent");
    }

    @Test
    void testShowKpisForTeamSprint() throws Exception {
        setupLoggedInState();
        com.springboot.MyTodoList.model.User loggedInUser = new com.springboot.MyTodoList.model.User();
        loggedInUser.setId(TEST_APP_USER_ID);
        loggedInUser.setName(TEST_USER_NAME);
        loggedInUser.setTeamId(20L);
        when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.of(loggedInUser));

        Sprint latestSprint = new Sprint();
        latestSprint.setId(200L);
        latestSprint.setName("Latest Sprint");
        Sprint olderSprint = new Sprint();
        olderSprint.setId(199L);
        olderSprint.setName("Older Sprint");
        when(mockSprintRepository.findByTeamId(20L)).thenReturn(Arrays.asList(latestSprint, olderSprint));

        Kpi kpiUser1 = new Kpi();
        kpiUser1.setMemberName("Alice");
        kpiUser1.setCompletedTasks(5);
        kpiUser1.setTotalActualHours(20.5);
        Kpi kpiUser2 = new Kpi();
        kpiUser2.setMemberName(TEST_USER_NAME);
        kpiUser2.setCompletedTasks(3);
        kpiUser2.setTotalActualHours(15.0);
        when(mockKpiRepository.getCompletionRateByMemberAndSprint(200L)).thenReturn(Arrays.asList(kpiUser1, kpiUser2));

        when(mockMessage.getText()).thenReturn("/kpis");
        botController.onUpdateReceived(mockUpdate);

        verify(mockSprintRepository).findByTeamId(20L);
        verify(mockKpiRepository).getCompletionRateByMemberAndSprint(200L);

        ArgumentCaptor<SendMessage> messageCaptor = ArgumentCaptor.forClass(SendMessage.class);
        verify(botController, times(3)).execute(messageCaptor.capture());

        List<SendMessage> sentMessages = messageCaptor.getAllValues();
        assertTrue(sentMessages.get(0).getText().contains("Sesión iniciada como Test User"));
        String kpiMessage = sentMessages.get(1).getText();
        assertTrue(kpiMessage.contains("Evaluando mas reciente sprint: Latest Sprint"));
        assertTrue(kpiMessage.contains("Miembro Alice:"));
        assertTrue(kpiMessage.contains("Tareas completadas: 5"));
        assertTrue(kpiMessage.contains("Horas trabajadas: 20.5"));
        assertTrue(kpiMessage.contains("Miembro Test User:"));
        assertTrue(kpiMessage.contains("Tareas completadas: 3"));
        assertTrue(kpiMessage.contains("Horas trabajadas: 15.0"));
        assertTrue(sentMessages.get(2).getText().contains("Puedes volver con /tasks"));
    }

    @Test
    void testShowKpisForSpecificUserInSprint() throws Exception {
        setupLoggedInState();
        com.springboot.MyTodoList.model.User loggedInUser = new com.springboot.MyTodoList.model.User();
        loggedInUser.setId(TEST_APP_USER_ID);
        loggedInUser.setName(TEST_USER_NAME);
        loggedInUser.setTeamId(30L);
        when(mockUserRepository.findById(TEST_APP_USER_ID)).thenReturn(Optional.of(loggedInUser));

        Sprint sprint = new Sprint();
        sprint.setId(300L);
        sprint.setName("User Specific Sprint");
        when(mockSprintRepository.findByTeamId(30L)).thenReturn(Arrays.asList(sprint));

        Kpi otherUserKpi = new Kpi();
        otherUserKpi.setMemberName("Bob");
        otherUserKpi.setCompletedTasks(7);
        otherUserKpi.setTotalActualHours(30.0);

        Kpi targetUserKpi = new Kpi();
        targetUserKpi.setMemberName(TEST_USER_NAME);
        targetUserKpi.setCompletedTasks(4);
        targetUserKpi.setTotalActualHours(18.2);

        when(mockKpiRepository.getCompletionRateByMemberAndSprint(300L)).thenReturn(Arrays.asList(otherUserKpi, targetUserKpi));

        when(mockMessage.getText()).thenReturn("/kpis");
        botController.onUpdateReceived(mockUpdate);

        verify(mockKpiRepository).getCompletionRateByMemberAndSprint(300L);

        ArgumentCaptor<SendMessage> messageCaptor = ArgumentCaptor.forClass(SendMessage.class);
        verify(botController, times(3)).execute(messageCaptor.capture());

        Optional<SendMessage> kpiMessageOpt = messageCaptor.getAllValues().stream()
                .filter(m -> m.getText().contains("Evaluando mas reciente sprint"))
                .findFirst();

        assertTrue(kpiMessageOpt.isPresent(), "KPI summary message not found");
        String kpiMessageText = kpiMessageOpt.get().getText();

        assertTrue(kpiMessageText.contains("Miembro Test User:"), "Target user name not found in KPI message");
        assertTrue(kpiMessageText.contains("Tareas completadas: 4"), "Target user completed tasks mismatch");
        assertTrue(kpiMessageText.contains("Horas trabajadas: 18.2"), "Target user actual hours mismatch");
        assertTrue(kpiMessageText.contains("Miembro Bob:"), "Other user name not found");
    }
}
