package com.springboot.MyTodoList;

import org.jdbi.v3.core.Jdbi;
import org.springframework.stereotype.Component;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

@Component
public class IdentityUtil {

    private final Jdbi jdbi;

    public IdentityUtil(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public Long getCurrentUserId(HttpServletRequest request) {
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

    public Optional<User> getCurrentUser(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return Optional.empty();
        }

        return jdbi.withExtension(UserRepository.class,
                repository -> repository.findById(userId));
    }

    public boolean isManager(HttpServletRequest request) {
        return getCurrentUser(request)
                .map(user -> "manager".equals(user.getRole()))
                .orElse(false);
    }

    public boolean canAccessTeam(HttpServletRequest request, Long teamId) {
        Optional<User> userOpt = getCurrentUser(request);
        if (!userOpt.isPresent()) {
            return false;
        }

        User user = userOpt.get();

        // Managers pueden acceder a cualquier equipo
        if ("manager".equals(user.getRole())) {
            return true;
        }

        // Users solo pueden acceder a su equipo
        return user.getTeamId() != null && user.getTeamId().equals(teamId);
    }
}