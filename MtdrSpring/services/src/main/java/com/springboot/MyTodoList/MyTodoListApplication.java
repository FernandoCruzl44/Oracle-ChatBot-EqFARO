package com.springboot.MyTodoList;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

@SpringBootApplication(exclude = HibernateJpaAutoConfiguration.class)
public class MyTodoListApplication {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

		logger.debug("Variables de entorno:");
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());

			// TODO: Debemos quitar log en prod, por dbpassword y token
			logger.debug("{}={}", entry.getKey(), entry.getValue());
		});

		SpringApplication.run(MyTodoListApplication.class, args);
	}
}