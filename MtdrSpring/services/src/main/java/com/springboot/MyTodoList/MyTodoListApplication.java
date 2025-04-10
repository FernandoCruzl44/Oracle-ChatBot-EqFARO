package com.springboot.MyTodoList;

import io.github.cdimascio.dotenv.Dotenv;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

import com.springboot.MyTodoList.service.LeaderElectionService;
import com.springboot.MyTodoList.service.TelegramBotService;

@SpringBootApplication(exclude = HibernateJpaAutoConfiguration.class)
public class MyTodoListApplication implements CommandLineRunner {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);
	private static Dotenv dotenv;

	@Autowired
	private LeaderElectionService leaderElectionService;

	@Autowired
	private TelegramBotService telegramBotService;

	public static void main(String[] args) {
		dotenv = Dotenv.configure().load();

		logger.debug("Loading environment variables:");
		dotenv.entries().forEach(entry -> {
			String key = entry.getKey();
			String value = entry.getValue();
			System.setProperty(key, value);
			String maskedValue = key.toLowerCase().contains("token") || key.toLowerCase().contains("password")
					|| key.toLowerCase().contains("secret") ? "********" : value;
			logger.debug("{}={}", key, maskedValue);
		});

		SpringApplication.run(MyTodoListApplication.class, args);
	}

	@Override
	public void run(String... args) {
		try {
			logger.info("Starting leader election process");
			leaderElectionService.startLeaderElection(telegramBotService);
		} catch (Exception e) {
			logger.error("Error during application startup: {}", e.getMessage(), e);
		}
	}
}