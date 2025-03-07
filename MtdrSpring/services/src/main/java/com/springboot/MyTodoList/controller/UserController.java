// File: /services/src/main/java/com/springboot/MyTodoList/controller/UserController.java
package com.springboot.MyTodoList.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.IdentityService;
import com.springboot.MyTodoList.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private IdentityService identityService;

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user, HttpServletRequest request) {
        // Only managers can create users
        if (!identityService.isManager(request)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        try {
            User createdUser = userService.createUser(user);
            return ResponseEntity.ok(createdUser);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error creating user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {

        // Check if user is authenticated
        User currentUser = identityService.getCurrentUser(request);
        if (currentUser == null) {
            List<User> users = userService.getUsers(skip, limit);
            return ResponseEntity.ok(users);
        }

        try {
            List<User> users = userService.getUsers(skip, limit);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Long userId, HttpServletRequest request) {
        // Check if user is authenticated
        User currentUser = identityService.getCurrentUser(request);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            return userService.getUser(userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long userId,
            @RequestBody User user,
            HttpServletRequest request) {

        // Check access permissions
        if (!identityService.isUserOrManager(request, userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        try {
            User updatedUser = userService.updateUser(userId, user);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error updating user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, HttpServletRequest request) {
        // Only managers can delete users
        if (!identityService.isManager(request)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error deleting user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{userId}/team")
    public ResponseEntity<?> assignUserToTeam(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {

        // Only managers can assign users to teams
        if (!identityService.isManager(request)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        Long teamId = Long.valueOf(requestBody.get("team_id").toString());
        String role = (String) requestBody.get("role");

        try {
            String result = userService.assignUserToTeam(userId, teamId, role);

            Map<String, String> response = new HashMap<>();
            response.put("message", result);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error assigning user to team: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/me/team")
    public ResponseEntity<?> getCurrentUserTeam(HttpServletRequest request) {
        User currentUser = identityService.getCurrentUser(request);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            Team team = userService.getUserTeam(currentUser);
            if (team == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", team.getId());
            response.put("nombre", team.getNombre());
            response.put("description", team.getDescription());
            response.put("role", currentUser.getTeamRole());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error getting user team: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
