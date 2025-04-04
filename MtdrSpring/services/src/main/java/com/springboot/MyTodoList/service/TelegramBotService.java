package com.springboot.MyTodoList.service;

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // Import @Value
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

import com.springboot.MyTodoList.controller.BotController; // Import BotController

import javax.annotation.PreDestroy; // Import for cleanup

@Service
public class TelegramBotService {
    private static final Logger logger = LoggerFactory.getLogger(TelegramBotService.class);

    private final Jdbi jdbi;
    private final String telegramBotToken;
    private final String telegramBotName;

    // Optional: Keep track of the session for potential cleanup
    private DefaultBotSession botSession;
    private BotController botController; // Keep a reference if needed

    // Inject Jdbi and configuration values via constructor
    @Autowired
    public TelegramBotService(
            Jdbi jdbi,
            @Value("${TELEGRAM_BOT_TOKEN}") String telegramBotToken, // Inject from properties/env
            @Value("${TELEGRAM_BOT_NAME}") String telegramBotName // Inject from properties/env
    ) {
        this.jdbi = jdbi;
        this.telegramBotToken = telegramBotToken;
        this.telegramBotName = telegramBotName;

        // Basic validation for injected properties
        if (this.telegramBotToken == null || this.telegramBotToken.isEmpty()
                || this.telegramBotToken.equals("YOUR_BOT_TOKEN")) {
            logger.error(
                    "TELEGRAM_BOT_TOKEN is not configured correctly. Please set it in your environment or application properties.");
            // Optionally throw an exception to prevent startup without a token
            // throw new IllegalStateException("Telegram Bot Token is not configured.");
        }
        if (this.telegramBotName == null || this.telegramBotName.isEmpty()
                || this.telegramBotName.equals("YOUR_BOT_USERNAME")) {
            logger.error(
                    "TELEGRAM_BOT_NAME is not configured correctly. Please set it in your environment or application properties.");
            // Optionally throw an exception
            // throw new IllegalStateException("Telegram Bot Name is not configured.");
        }
    }

    /**
     * Registers and starts the Telegram bot polling.
     * This method should typically be called only once, often triggered by
     * the LeaderElectionService when leadership is acquired.
     */
    public void registerBot() {
        // Prevent multiple registrations if called again accidentally
        if (botSession != null && botSession.isRunning()) {
            logger.warn("Bot registration requested, but a session is already running.");
            return;
        }

        // Validate token again before attempting registration
        if (telegramBotToken == null || telegramBotToken.isEmpty() || telegramBotToken.equals("YOUR_BOT_TOKEN")) {
            logger.error("Cannot register bot: TELEGRAM_BOT_TOKEN is not configured.");
            return;
        }
        if (telegramBotName == null || telegramBotName.isEmpty() || telegramBotName.equals("YOUR_BOT_USERNAME")) {
            logger.error("Cannot register bot: TELEGRAM_BOT_NAME is not configured.");
            return;
        }

        try {
            logger.info("Registering Telegram bot with username: {}", telegramBotName);
            TelegramBotsApi telegramBotsApi = new TelegramBotsApi(DefaultBotSession.class);

            // Instantiate the BotController, passing the Jdbi instance and config
            // BotController now correctly handles Jdbi internally
            this.botController = new BotController(telegramBotToken, telegramBotName, jdbi);

            // Start the bot session
            this.botSession = (DefaultBotSession) telegramBotsApi.registerBot(botController);

            logger.info("Bot registered and polling started successfully!");

        } catch (TelegramApiException e) {
            logger.error("Failed to register or start Telegram bot session", e);
            // Reset session state on failure
            this.botSession = null;
            this.botController = null;
        } catch (Exception e) {
            // Catch any other unexpected errors during setup
            logger.error("Unexpected error during bot registration", e);
            this.botSession = null;
            this.botController = null;
        }
    }

    /**
     * Stops the bot session cleanly when the application shuts down
     * or when leadership is lost (though leader election handles this implicitly
     * by terminating the pod). This is good practice for resource cleanup.
     */
    @PreDestroy
    public void stopBot() {
        if (botSession != null && botSession.isRunning()) {
            logger.info("Stopping Telegram bot session...");
            botSession.stop();
            logger.info("Telegram bot session stopped.");
        }
        this.botSession = null;
        this.botController = null; // Release reference
    }

    // Optional: Method to check if the bot is currently registered and running
    public boolean isBotRunning() {
        return botSession != null && botSession.isRunning();
    }
}
