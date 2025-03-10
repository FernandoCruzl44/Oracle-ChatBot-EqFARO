package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.repository.UserRepository;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/teams")
public class TeamEndpoint {

    private final Jdbi jdbi;

    public TeamEndpoint(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @GetMapping
    public ResponseEntity<?> getTeams(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {

        Long currentUserId = getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

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
        Long currentUserId = getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
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
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        if (!isManager(httpRequest)) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        try {
            return jdbi.inTransaction(handle -> {
                Team team = new Team();
                team.setName(request.get("name"));
                team.setDescription(request.get("description"));

                Long teamId = handle.attach(TeamRepository.class).insert(team);
                team.setId(teamId);

                return ResponseEntity.status(HttpStatus.CREATED).body(team);
            });
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error creating team: " + e.getMessage()));
        }
    }

    // TODO: Implemenar updateTeam y deleteTeam

    // Helper methods for identity management
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