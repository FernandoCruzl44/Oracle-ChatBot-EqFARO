package com.springboot.MyTodoList;

import io.github.cdimascio.dotenv.Dotenv;

import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

import com.springboot.MyTodoList.controller.BotController;
import com.springboot.MyTodoList.service.LeaderElectionService;
import com.springboot.MyTodoList.service.TelegramBotService;

@SpringBootApplication(exclude = HibernateJpaAutoConfiguration.class)
public class MyTodoListApplication implements CommandLineRunner {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);
	private static Dotenv dotenv;
	public static Jdbi jdbi;

	@Autowired
	private LeaderElectionService leaderElectionService;

	@Autowired
	private TelegramBotService telegramBotService;

	public static void main(String[] args) {
		dotenv = Dotenv.configure().load();

		logger.debug("Variables de entorno:");
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
			logger.debug("{}={}", entry.getKey(), entry.getValue());
		});

		SpringApplication.run(MyTodoListApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		// Initialize leader election with the Telegram bot service
		leaderElectionService.startLeaderElection(telegramBotService);

		// No need to sleep or check leadership status here
		// Bot registration will happen automatically when leadership is acquired
	}
}