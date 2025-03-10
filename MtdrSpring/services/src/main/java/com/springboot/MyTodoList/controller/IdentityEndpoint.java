package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.IdentityUtil;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/identity")
public class IdentityEndpoint {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    public IdentityEndpoint(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    @PostMapping("/set/{userId}")
    public ResponseEntity<?> setIdentity(
            @PathVariable Long userId,
            HttpServletResponse response) {

        Optional<User> userOpt = jdbi.withExtension(UserRepository.class,
                repository -> repository.findById(userId));

        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        Cookie cookie = new Cookie("user_id", userId.toString());
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60); // 1 dia
        response.addCookie(cookie);

        Map<String, String> result = new HashMap<>();
        result.put("message", "Identity set to: " + user.getName() + " (" + user.getRole() + ")");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentIdentity(HttpServletRequest request) {
        Optional<User> userOpt = identityUtil.getCurrentUser(request);

        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            Map<String, String> response = new HashMap<>();
            response.put("message", "No identity set");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/clear")
    public ResponseEntity<?> clearIdentity(HttpServletResponse response) {
        Cookie cookie = new Cookie("user_id", null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        return ResponseEntity.ok(Map.of("message", "Identity cleared"));
    }
}