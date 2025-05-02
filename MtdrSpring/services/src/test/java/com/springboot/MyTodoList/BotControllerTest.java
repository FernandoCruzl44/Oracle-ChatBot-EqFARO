package com.springboot.MyTodoList;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.chat.Chat;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;

import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.service.TelegramBotService;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestInstance(Lifecycle.PER_CLASS)
@ActiveProfiles("test")
public class BotControllerTest {

	@Autowired
	private TelegramBotService telegramBotService;
	private BotController botController; // Autowire your BotController
	
    // @MockBean
    // private AuthenticationService mockAuthenticationService;
    // @MockBean
    // private GeminiController mockGeminiController;

    // List to capture the API methods the bot attempts to send
    private List<SendMessage> capturedMessages;

    @BeforeAll
    public void setUp() {
        // Initialize the list to capture methods before each test
        capturedMessages = new ArrayList<>();

		botController = telegramBotService.createBotController();

        // Configure your mock dependencies if needed for specific test cases.
        // For example, if a test requires a user to be authenticated:
        // when(mockAuthenticationService.isAuthenticated(anyLong())).thenReturn(true);

        // Set the test API method sender on the botController
        botController.setMessageDiverter(capturedMessages);
    }

    @Test
    public void testStartCommandSendsWelcomeMessage() {
        // Arrange: Create a mock Update for the "/start" command
        Update update = createTextMessageUpdate(12345L, "/start");

        // Act: Process the update directly
        botController.RespondToUpdate(update);

        // Assert: Verify that a SendMessage was captured and check its content
        assertEquals(1, capturedMessages.size(), "Should send exactly one API method");
        SendMessage capturedMethod = capturedMessages.get(0);

        assertTrue(capturedMethod instanceof SendMessage, "The sent method should be a SendMessage");
        SendMessage sentMessage = (SendMessage) capturedMethod;

        assertEquals(12345L, Long.parseLong(sentMessage.getChatId()), "Should send message to the correct chat ID");
        // Replace with the expected welcome message text for the /start command
        assertEquals("Welcome!", sentMessage.getText(), "Should send the correct welcome message text");


		System.out.println("HEEEELP HELP MEEEEE");

        // You can also check other properties like parse mode, reply markup, etc.
        // assertEquals(ParseMode.HTML, sentMessage.getParseMode());
        // assertTrue(sentMessage.getReplyMarkup() instanceof ReplyKeyboardMarkup);
    }

    @Test
    public void testHelloMessageSendsResponse() {
        // Arrange: Create a mock Update for a "hello" text message
        Update update = createTextMessageUpdate(67890L, "hello");

        // Act: Process the update directly
        botController.RespondToUpdate(update);

        // Assert: Verify the captured message content
        assertEquals(1, capturedMessages.size(), "Should send exactly one API method");
        SendMessage capturedMessage = capturedMessages.get(0);

        assertEquals(67890L, Long.parseLong(capturedMessage.getChatId()), "Should send message to the correct chat ID");
        // Replace with the expected response text for "hello"
        assertEquals("Hello, world!", capturedMessage.getText(), "Should send the correct response text");
    }

    // Add more test methods for:
    // - Different commands
    // - Messages that interact with your mocked services (authentication, Gemini)
    // - Callback queries
    // - Error scenarios
    // - Messages that trigger database interactions (verify calls on mock Jdbi/repositories)

    // --- Helper Methods ---

    // Helper method to create a simple text message Update
    private Update createTextMessageUpdate(Long chatId, String text) {
        Update update = new Update();
        Message message = new Message();
        message.setText(text);
        message.setChat(new Chat(chatId, "private"));
        update.setMessage(message);
        return update;
    }

	@AfterEach
	public void printResults() {
		
	}

    // Add helper methods for creating other update types (callback queries, etc.)
}
