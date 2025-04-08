package com.springboot.MyTodoList;

import org.jdbi.v3.core.Jdbi;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

@Component
public class IdentityUtil {

    private final Jdbi jdbi;

    public IdentityUtil(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Long getCurrentUserId(HttpServletRequest request) {
        User currentUser = getCurrentUserFromSecurity();
        return currentUser != null ? currentUser.getId() : null;
    }

    public Optional<User> getCurrentUser(HttpServletRequest request) {
        User currentUser = getCurrentUserFromSecurity();
        return Optional.ofNullable(currentUser);
    }

    private User getCurrentUserFromSecurity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }

    public boolean isManager(HttpServletRequest request) {
        User currentUser = getCurrentUserFromSecurity();
        return currentUser != null && "manager".equals(currentUser.getRole());
    }

    public boolean canAccessTeam(HttpServletRequest request, Long teamId) {
        User currentUser = getCurrentUserFromSecurity();
        if (currentUser == null) {
            return false;
        }

        // Managers can access any team
        if ("manager".equals(currentUser.getRole())) {
            return true;
        }

        // Users can only access their team
        return currentUser.getTeamId() != null && currentUser.getTeamId().equals(teamId);
    }
}