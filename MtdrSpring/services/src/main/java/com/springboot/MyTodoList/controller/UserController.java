package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final Jdbi jdbi;

    public UserController(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {

        try {
            List<User> users = jdbi.withExtension(UserRepository.class,
                    repository -> repository.findAll(limit, skip));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error retrieving users");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Long userId, HttpServletRequest request) {
        Long currentUserId = getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.withExtension(UserRepository.class, repository -> {
            Optional<User> user = repository.findById(userId);
            return user.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        });
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user, HttpServletRequest request) {
        if (!isManager(request)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        try {
            Long newId = jdbi.withExtension(UserRepository.class,
                    repository -> repository.insert(user));

            Map<String, Object> response = new HashMap<>();
            response.put("id", newId);
            response.put("message", "User created successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating user: " + e.getMessage()));
        }
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("user_id".equals(cookie.getName())) {
                    try {
                        return Long.parseLong(cookie.getValue());
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }
            }
        }
        return null;
    }

    private boolean isManager(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return false;
        }

        return jdbi.withExtension(UserRepository.class, repository -> {
            Optional<User> user = repository.findById(userId);
            return user.map(u -> "manager".equals(u.getRole())).orElse(false);
        });
    }
}