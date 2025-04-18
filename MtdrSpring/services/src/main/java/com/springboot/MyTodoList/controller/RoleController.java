package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.MyTodoList.repository.RoleRepository;
import com.springboot.MyTodoList.IdentityUtil;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    public RoleController(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    @GetMapping("/team-roles")
    public ResponseEntity<?> getTeamRoles(HttpServletRequest request) {
        // Authentication check
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized - No user context"));
        }

        try {
            List<String> roles = jdbi.withHandle(handle -> handle.attach(RoleRepository.class).findAllTeamRoles());
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error fetching team roles: " + e.getMessage()));
        }
    }
}