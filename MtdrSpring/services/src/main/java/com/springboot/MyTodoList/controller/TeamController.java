package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.IdentityUtil; // Import IdentityUtil

// Removed unused Cookie import
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil; // Inject IdentityUtil

    // Update constructor to accept IdentityUtil
    public TeamController(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    @GetMapping
    public ResponseEntity<?> getTeams(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {

        // --- FIX: Use IdentityUtil ---
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            // This check should ideally not be hit if WebSecurityConfig requires
            // authentication
            // But keep it as a safeguard or for clarity
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized - No user context"));
        }

        // Optional: Add manager check if needed for this specific endpoint,
        // although WebSecurityConfig's .authenticated() might be sufficient
        // if (!identityUtil.isManager(request)) {
        // return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        // }

        return jdbi.inTransaction(handle -> {
            List<Team> teams = handle.attach(TeamRepository.class).findAll(limit, skip);

            for (Team team : teams) {
                List<User> members = handle.attach(TeamRepository.class)
                        .findMembersByTeamId(team.getId());
                team.setMembers(members);
            }

            return ResponseEntity.ok(teams);
        });
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Long teamId, HttpServletRequest request) {
        // --- FIX: Use IdentityUtil ---
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized - No user context"));
        }

        // Authorization check: Allow managers or members of the specific team
        if (!identityUtil.isManager(request) && !identityUtil.canAccessTeam(request, teamId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        return jdbi.inTransaction(handle -> {
            Optional<Team> teamOpt = handle.attach(TeamRepository.class).findById(teamId);

            if (teamOpt.isPresent()) {
                Team team = teamOpt.get();
                List<User> members = handle.attach(TeamRepository.class)
                        .findMembersByTeamId(team.getId());
                team.setMembers(members);
                return ResponseEntity.ok(team);
            } else {
                return ResponseEntity.notFound().build();
            }
        });
    }

    @PostMapping
    public ResponseEntity<?> createTeam(
            @RequestBody Map<String, String> requestBody, // Renamed from request to avoid confusion
            HttpServletRequest httpRequest) {

        // --- FIX: Use IdentityUtil ---
        if (!identityUtil.isManager(httpRequest)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: Only managers can create teams"));
        }

        // Basic validation
        String name = requestBody.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Team name is required"));
        }

        try {
            return jdbi.inTransaction(handle -> {
                Team team = new Team();
                team.setName(name);
                team.setDescription(requestBody.get("description")); // Description is optional

                Long teamId = handle.attach(TeamRepository.class).insert(team);
                team.setId(teamId);

                // Fetch the created team to include members (likely none initially)
                Optional<Team> createdTeamOpt = handle.attach(TeamRepository.class).findById(teamId);
                if (createdTeamOpt.isPresent()) {
                    Team createdTeam = createdTeamOpt.get();
                    createdTeam.setMembers(List.of()); // Initialize members list
                    return ResponseEntity.status(HttpStatus.CREATED).body(createdTeam);
                } else {
                    // Should not happen, but handle defensively
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to retrieve created team"));
                }
            });
        } catch (Exception e) {
            // Log the exception
            // logger.error("Error creating team", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating team: " + e.getMessage()));
        }
    }

    // TODO: Implement updateTeam and deleteTeam using IdentityUtil for
    // authorization

    // --- REMOVE the cookie-based helper methods ---
    // private Long getCurrentUserId(HttpServletRequest request) { ... }
    // private boolean isManager(HttpServletRequest request) { ... }
}
