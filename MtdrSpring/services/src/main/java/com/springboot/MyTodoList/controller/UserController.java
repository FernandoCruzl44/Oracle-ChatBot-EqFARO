package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.IdentityUtil;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    // Update constructor to accept IdentityUtil
    public UserController(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        // --- FIX: Use IdentityUtil to get the user from Security Context ---
        Optional<User> userOpt = identityUtil.getCurrentUser(request);

        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            // If IdentityUtil returns empty, it means the JWT filter didn't authenticate
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized - No valid authentication context"));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {

        // --- FIX: Use IdentityUtil for authorization check if needed ---
        // Example: Check if user is authenticated before allowing access to all users
        if (!identityUtil.getCurrentUser(request).isPresent()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        // Optional: Add manager check if only managers should see all users
        // if (!identityUtil.isManager(request)) {
        // return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        // }

        try {
            List<User> users = jdbi.withExtension(UserRepository.class,
                    repository -> repository.findAll(limit, skip));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace(); // Keep logging for debugging

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error retrieving users");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Long userId, HttpServletRequest request) {
        // --- FIX: Use IdentityUtil for authorization check ---
        if (!identityUtil.getCurrentUser(request).isPresent()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        // Optional: Add manager/self check if needed
        // Long currentUserId = identityUtil.getCurrentUserId(request);
        // if (!identityUtil.isManager(request) && !userId.equals(currentUserId)) {
        // return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        // }

        return jdbi.withExtension(UserRepository.class, repository -> {
            Optional<User> user = repository.findById(userId);
            return user.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        });
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user, HttpServletRequest request) {
        // --- FIX: Use IdentityUtil for authorization check ---
        if (!identityUtil.isManager(request)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        // No change needed in the try block itself if signup handles password encoding
        try {
            // Assuming AuthenticationService.signup handles password encoding
            // If not, you need to encode the password here before inserting
            // user.setPassword(passwordEncoder.encode(user.getPassword()));

            Long newId = jdbi.withExtension(UserRepository.class,
                    repository -> repository.insert(user));

            // Fetch the created user to return (optional, but good practice)
            Optional<User> createdUser = jdbi.withExtension(UserRepository.class,
                    repo -> repo.findById(newId));

            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser.orElse(null)); // Return created user or
                                                                                             // null/error

        } catch (Exception e) {
            e.printStackTrace(); // Keep logging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating user: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}/team-role")
    public ResponseEntity<?> updateUserTeamRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> requestBody,
            HttpServletRequest request) {

        // Only managers can update team roles
        if (!identityUtil.isManager(request)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: Only managers can update team roles"));
        }

        String newRole = requestBody.get("teamRole");
        if (newRole == null || newRole.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Team role is required"));
        }

        try {
            int updated = jdbi.withExtension(UserRepository.class,
                    repository -> repository.updateTeamRole(userId, newRole));

            if (updated == 0) {
                return ResponseEntity.notFound().build();
            }

            // Return the updated user
            Optional<User> user = jdbi.withExtension(UserRepository.class, repository -> repository.findById(userId));

            return user.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating user team role: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}/team-assignment")
    public ResponseEntity<?> assignUserToTeam(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {

        // Only managers can assign users to teams
        if (!identityUtil.isManager(request)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Forbidden: Only managers can assign users to teams"));
        }

        // Extract teamId from request body
        final Long teamId;
        if (requestBody.containsKey("teamId") && requestBody.get("teamId") != null) {
            try {
                String teamIdStr = requestBody.get("teamId").toString();
                teamId = teamIdStr.isEmpty() ? null : Long.valueOf(teamIdStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid team ID format"));
            }
        } else {
            teamId = null;
        }

        try {
            int updated = jdbi.withExtension(UserRepository.class,
                    repository -> repository.updateTeamAssignment(userId, teamId));

            if (updated == 0) {
                return ResponseEntity.notFound().build();
            }

            // Return the updated user
            Optional<User> user = jdbi.withExtension(UserRepository.class, repository -> repository.findById(userId));

            return user.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error assigning user to team: " + e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long userId,
            @RequestBody User user,
            HttpServletRequest request) {

        // Only managers can update users or users can update themselves
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        boolean isManager = identityUtil.isManager(request);
        if (!isManager && !userId.equals(currentUserId)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Forbidden: Can only update your own user details"));
        }

        try {
            // Set the ID from the path parameter
            user.setId(userId);

            int updated = jdbi.withExtension(UserRepository.class,
                    repository -> repository.update(user));

            if (updated == 0) {
                return ResponseEntity.notFound().build();
            }

            // Return the updated user
            Optional<User> updatedUser = jdbi.withExtension(UserRepository.class,
                    repository -> repository.findById(userId));

            return updatedUser.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating user: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long userId,
            HttpServletRequest request) {

        // Only managers can delete users
        if (!identityUtil.isManager(request)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Forbidden: Only managers can delete users"));
        }

        try {
            // Get the user to check if it exists
            Optional<User> userToDelete = jdbi.withExtension(UserRepository.class,
                    repository -> repository.findById(userId));

            if (!userToDelete.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Proceed with deletion
            int deleted = jdbi.withExtension(UserRepository.class,
                    repository -> repository.delete(userId));

            if (deleted > 0) {
                return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
            } else {
                return ResponseEntity.status(500)
                        .body(Map.of("error", "Failed to delete user"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error deleting user: " + e.getMessage()));
        }
    }
}
