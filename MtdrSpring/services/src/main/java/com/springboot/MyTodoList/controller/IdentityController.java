// /src/main/java/com/springboot/MyTodoList/controller/IdentityController.java
package com.springboot.MyTodoList.controller;

import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.IdentityService;
import com.springboot.MyTodoList.service.UserService;

@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    @Autowired
    private IdentityService identityService;

    @Autowired
    private UserService userService;

    @PostMapping("/set/{userId}")
    public ResponseEntity<?> setIdentity(@PathVariable Long userId, HttpServletResponse response) {
        User user = userService.getUser(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cookie cookie = new Cookie("user_id", userId.toString());
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60); // 1 day
        response.addCookie(cookie);

        Map<String, String> result = new HashMap<>();
        result.put("message", "Identity set to: " + user.getNombre() + " (" + user.getRole() + ")");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentIdentity(HttpServletRequest request) {
        try {
            User currentUser = identityService.getCurrentUser(request);
            if (currentUser != null) {
                return ResponseEntity.ok(currentUser);
            } else {
                Map<String, String> response = new HashMap<>();
                response.put("message", "No identity set");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching current user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
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
