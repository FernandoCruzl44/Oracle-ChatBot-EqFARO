// /src/main/java/com/springboot/MyTodoList/service/IdentityService.java
package com.springboot.MyTodoList.service;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;

@Service
public class IdentityService {

    @Autowired
    private UserRepository userRepository;

    public User getCurrentUser(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("user_id".equals(cookie.getName())) {
                    try {
                        Long userId = Long.parseLong(cookie.getValue());
                        return userRepository.findById(userId).orElse(null);
                    } catch (NumberFormatException e) {
                        e.printStackTrace();
                        return null;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return null;
                    }
                }
            }
        }
        return null;
    }

    public boolean isManager(HttpServletRequest request) {
        User user = getCurrentUser(request);
        return user != null && "manager".equals(user.getRole());
    }

    public boolean isUserOrManager(HttpServletRequest request, Long userId) {
        User currentUser = getCurrentUser(request);
        if (currentUser == null) {
            return false;
        }

        if ("manager".equals(currentUser.getRole())) {
            return true;
        }

        return currentUser.getId().equals(userId);
    }

    public boolean canAccessTeam(HttpServletRequest request, Long teamId) {
        User user = getCurrentUser(request);
        if (user == null) {
            return false;
        }

        if ("manager".equals(user.getRole())) {
            return true;
        }

        if (user.getTeam() != null) {
            return user.getTeam().getId().equals(teamId);
        }

        return false;
    }
}
