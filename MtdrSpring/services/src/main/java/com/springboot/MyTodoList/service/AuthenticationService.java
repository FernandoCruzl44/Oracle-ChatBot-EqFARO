package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import org.jdbi.v3.core.Jdbi;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {
    private final Jdbi jdbi;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthenticationService(
            Jdbi jdbi,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder
    ) {
        this.jdbi = jdbi;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
    }

    public User signup(User user) {
        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            
            // Check if email exists
            if (userRepo.existsByEmail(user.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
            
            // Encode password
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            
            // Set default role if not provided
            if (user.getRole() == null) {
                user.setRole("user");
            }
            
            // Insert user and get ID
            Long userId = userRepo.insert(user);
            user.setId(userId);
            
            return user;
        });
    }

    public User authenticate(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
        
        return jdbi.withExtension(UserRepository.class, repo -> 
            repo.findByEmail(email).orElseThrow()
        );
    }
}