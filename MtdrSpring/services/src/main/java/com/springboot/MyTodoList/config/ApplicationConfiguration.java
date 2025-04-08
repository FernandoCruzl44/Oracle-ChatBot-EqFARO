package com.springboot.MyTodoList.config;

import com.springboot.MyTodoList.repository.UserRepository;
import org.jdbi.v3.core.Jdbi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class ApplicationConfiguration {
    private final Jdbi jdbi;

    public ApplicationConfiguration(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @Bean
    UserDetailsService userDetailsService() {
        return username -> {
            // This is more explicit about type casting to fix the error
            try {
                return jdbi.withExtension(UserRepository.class, repo -> {
                    return repo.findByEmail(username)
                            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
                });
            } catch (Exception e) {
                throw new UsernameNotFoundException("Error fetching user: " + e.getMessage());
            }
        };
    }

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }
}