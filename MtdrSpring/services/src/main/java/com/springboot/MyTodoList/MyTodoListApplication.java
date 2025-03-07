// /src/main/java/com/springboot/MyTodoList/MyTodoListApplication.java
package com.springboot.MyTodoList;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyTodoListApplication {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
			logger.debug("Setting env variable: {}", entry.getKey());
		});

		SpringApplication.run(MyTodoListApplication.class, args);
	}

}