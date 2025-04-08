// src/main/java/com/springboot/MyTodoList/config/CorsConfig.java
// (No changes needed, keep as is)
package com.springboot.MyTodoList.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.List;

@Configuration
public class CorsConfig {
    Logger logger = LoggerFactory.getLogger(CorsConfig.class);

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        // Ensure these origins match your frontend and any other allowed clients
        config.setAllowedOrigins(List.of("http://localhost:3000", "https://objectstorage.us-phoenix-1.oraclecloud.com",
                "https://petstore.swagger.io"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));
        config.addAllowedHeader("*");
        config.addExposedHeader("location");
        // Keep Authorization exposed for the frontend to read the token if needed
        config.addExposedHeader("Authorization");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Apply CORS to all paths
        return new CorsFilter(source);
    }
}
