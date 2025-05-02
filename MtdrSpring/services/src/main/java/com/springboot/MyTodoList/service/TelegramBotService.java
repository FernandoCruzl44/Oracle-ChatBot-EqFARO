package com.springboot.MyTodoList.service;
// In your TelegramBotService.java

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // Import Value
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.longpolling.TelegramBotsLongPollingApplication;

import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.controller.GeminiController;
import com.springboot.MyTodoList.service.AuthenticationService;

@Service
public class TelegramBotService {
    private static final Logger logger = LoggerFactory.getLogger(TelegramBotService.class);

    private final Jdbi jdbi;
    private final AuthenticationService autentication;
    private final GeminiController geminiController;

	private String telegramBotToken;
	private String telegramBotName;

	@Autowired
	Environment env;

    public TelegramBotService(Jdbi jdbi, AuthenticationService autentication, GeminiController geminiController) {
        this.jdbi = jdbi;
        this.autentication = autentication;
        this.geminiController = geminiController;
		
		telegramBotToken = System.getProperty("TELEGRAM_BOT_TOKEN");
		telegramBotName = System.getProperty("TELEGRAM_BOT_NAME");
    }

    // Method for testing
    public BotController createBotController() {

        // Create the BotController instance just like in registerBot,
        // but use the injected token and name (now from @Value)
        logger.info("Creating BotController instance for testing");
        BotController botController = new BotController(
                telegramBotToken, // Use injected token
                telegramBotName, // Use injected name
                jdbi,
                autentication,
                geminiController
        );
        return botController;
    }


    public void registerBot() {
		try (TelegramBotsLongPollingApplication botsApplication = new TelegramBotsLongPollingApplication()) {
			logger.info("Registering Telegram bot");

			// Read from injected values now
			// String telegramBotToken = System.getProperty("TELEGRAM_BOT_TOKEN"); // Remove or keep for System Property fallback
			// String telegramBotName = System.getProperty("TELEGRAM_BOT_NAME"); // Remove or keep for System Property fallback

			logger.info("Bot initializing with username: {}", telegramBotName);

			// Create the BotController instance using the injected values
			BotController botController = createBotController();

			botsApplication.registerBot(telegramBotToken, botController);

			logger.info("Bot registered and started successfully!");
			Thread.currentThread().join();
		} catch (Exception e) {
			logger.error("Failed to register Telegram bot", e);
		}
    }
}
