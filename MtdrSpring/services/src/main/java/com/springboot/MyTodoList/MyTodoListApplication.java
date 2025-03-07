package com.springboot.MyTodoList;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class MyTodoListApplication {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);

	public static void main(String[] args) {
		// Load environment variables from .env file
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
			logger.debug("Setting env variable: {}", entry.getKey());
		});

		SpringApplication.run(MyTodoListApplication.class, args);
	}

	// @Bean
	// public WebMvcConfigurer corsConfigurer() {
	// return new WebMvcConfigurer() {
	// @Override
	// public void addCorsMappings(CorsRegistry registry) {
	// registry.addMapping("/**")
	// .allowedOrigins("*")
	// .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
	// .allowedHeaders("*")
	// .exposedHeaders("location");
	// }
	// };
	// }
}