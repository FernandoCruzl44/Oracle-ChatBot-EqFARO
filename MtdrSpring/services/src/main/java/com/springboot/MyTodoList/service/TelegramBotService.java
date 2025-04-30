package com.springboot.MyTodoList.service;

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.longpolling.TelegramBotsLongPollingApplication;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.webhook.TelegramBotsWebhookApplication;
import org.telegram.telegrambots.webhook.WebhookOptions;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;


import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.controller.GeminiController;


@Service
public class TelegramBotService {
    private static final Logger logger = LoggerFactory.getLogger(TelegramBotService.class);

    private final Jdbi jdbi;
    private final AuthenticationService autentication; 
    private final GeminiController geminiController;

	public TelegramBotService(Jdbi jdbi, AuthenticationService autentication, GeminiController geminiController) {
		//public TelegramBotService(Jdbi jdbi, AuthenticationService autentication) {
        this.jdbi = jdbi;
        this.autentication = autentication;
	this.geminiController = geminiController;
    }

    public void registerBot() {
		try (TelegramBotsLongPollingApplication botsApplication = new TelegramBotsLongPollingApplication()) {
            logger.info("Registering Telegram bot");
            //TelegramBotsApi telegramBotsApi = new TelegramBotsApi(DefaultBotSession.class);
			;

            String telegramBotToken = System.getProperty("TELEGRAM_BOT_TOKEN");
            String telegramBotName = System.getProperty("TELEGRAM_BOT_NAME");

            logger.info("Bot initializing with username: {}", telegramBotName);

            BotController botController = new BotController(telegramBotToken, telegramBotName, jdbi, autentication, geminiController);
            //telegramBotsApi.registerBot(botController);
			botsApplication.registerBot(telegramBotToken, botController);

            logger.info("Bot registered and started successfully!");
			Thread.currentThread().join();
        } catch (Exception e) {
            logger.error("Failed to register Telegram bot", e);
        }
    }
}
