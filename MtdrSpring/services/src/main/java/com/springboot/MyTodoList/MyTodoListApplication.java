package com.springboot.MyTodoList;

import io.github.cdimascio.dotenv.Dotenv;

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.repository.CommentRepository;

@SpringBootApplication(exclude = HibernateJpaAutoConfiguration.class)
public class MyTodoListApplication implements CommandLineRunner {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);

	private static Dotenv dotenv;

	public static Jdbi jdbi;

	public static void main(String[] args) {

		dotenv = Dotenv.configure().load();

		logger.debug("Variables de entorno:");
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());

			// TODO: Debemos quitar log en prod, por dbpassword y token
			logger.debug("{}={}", entry.getKey(), entry.getValue());
		});

		SpringApplication.run(MyTodoListApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		try {
			TelegramBotsApi telegramBotsApi = new TelegramBotsApi(DefaultBotSession.class);

			String telegramBotToken = dotenv.get("TELEGRAM_BOT_TOKEN");
			String telegramBotName = dotenv.get("TELEGRAM_BOT_NAME");

			telegramBotsApi.registerBot(new BotController(telegramBotToken, telegramBotName, jdbi));
			
			logger.info("Bot registered and started succesfully!");
		} catch (TelegramApiException e) {
			e.printStackTrace();
		}
	}
}
