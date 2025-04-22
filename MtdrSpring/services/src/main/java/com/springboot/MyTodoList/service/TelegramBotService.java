package com.springboot.MyTodoList.service;

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

import com.springboot.MyTodoList.controller.BotController;


@Service
public class TelegramBotService {
    private static final Logger logger = LoggerFactory.getLogger(TelegramBotService.class);

    private final Jdbi jdbi;
    private final AuthenticationService autentication; 
    

    public TelegramBotService(Jdbi jdbi, AuthenticationService autentication) {
        this.jdbi = jdbi;
        this.autentication = autentication;

    }

    public void registerBot() {
        try {
            logger.info("Registering Telegram bot");
            TelegramBotsApi telegramBotsApi = new TelegramBotsApi(DefaultBotSession.class);

            String telegramBotToken = System.getProperty("TELEGRAM_BOT_TOKEN");
            String telegramBotName = System.getProperty("TELEGRAM_BOT_NAME");

            logger.info("Bot initializing with username: {}", telegramBotName);

            BotController botController = new BotController(telegramBotToken, telegramBotName, jdbi, autentication);
            telegramBotsApi.registerBot(botController);

            logger.info("Bot registered and started successfully!");
        } catch (TelegramApiException e) {
            logger.error("Failed to register Telegram bot", e);
        }
    }
}