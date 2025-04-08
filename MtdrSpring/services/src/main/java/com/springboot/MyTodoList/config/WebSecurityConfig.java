// src/main/java/com/springboot/MyTodoList/config/WebSecurityConfig.java
package com.springboot.MyTodoList.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    public WebSecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthenticationProvider authenticationProvider) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors().and() // Enable CORS integration
                .csrf().disable() // Disable CSRF as we are using JWT
                .authorizeRequests(authorize -> authorize
                        // --- Allow Frontend Static Assets & Routing ---
                        // Permit root, index.html, assets, manifest, favicon, etc.
                        // Permit frontend routes handled by FrontendForwardingController
                        .antMatchers(
                                "/",
                                "/index.html",
                                "/favicon.ico",
                                "/manifest.json",
                                "/assets/**", // Permit all files under /assets
                                "/static/**", // Permit all files under /static (if used)
                                // Add other specific static file patterns if needed (e.g., "/*.png")
                                // Frontend routes:
                                "/register",
                                "/login",
                                "/team",
                                "/productivity",
                                "/error")
                        .permitAll()

                        // --- Allow Public API Endpoints ---
                        .antMatchers("/api/auth/**").permitAll() // Authentication
                        .antMatchers("/api", "/api/healthcheck", "/api/debug").permitAll() // Public info/health

                        // --- Secure Protected API Endpoints ---
                        // Require authentication for ALL other requests starting with /api/
                        .antMatchers("/api/**").authenticated()

                        // --- Handle anything else ---
                        // Option A: Deny any other unexpected requests (More Secure)
                        // .anyRequest().denyAll()
                        // Option B: Permit any other requests (Use if Option A breaks something
                        // unexpected)
                        .anyRequest().permitAll()
                // Option C: Authenticate any other requests (Original safe default)
                // .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Stateless session management
                )
                .authenticationProvider(authenticationProvider) // Set the custom auth provider
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Add JWT filter

        return http.build();
    }
}
