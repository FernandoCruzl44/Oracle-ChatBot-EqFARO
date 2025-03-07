// File: /services/src/main/java/com/springboot/MyTodoList/service/UserService.java
package com.springboot.MyTodoList.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public List<User> getUsers(int skip, int limit) {
        return userRepository.findAllByOrderByIdAsc(PageRequest.of(skip / limit, limit));
    }

    public Optional<User> getUser(Long userId) {
        return userRepository.findById(userId);
    }

    @Transactional
    public User updateUser(Long userId, User userUpdates) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userUpdates.getNombre() != null) {
            existingUser.setNombre(userUpdates.getNombre());
        }

        if (userUpdates.getEmail() != null) {
            existingUser.setEmail(userUpdates.getEmail());
        }

        if (userUpdates.getPassword() != null) {
            existingUser.setPassword(userUpdates.getPassword());
        }

        if (userUpdates.getRole() != null) {
            existingUser.setRole(userUpdates.getRole());
        }

        if (userUpdates.getTelegramId() != null) {
            existingUser.setTelegramId(userUpdates.getTelegramId());
        }

        if (userUpdates.getChatId() != null) {
            existingUser.setChatId(userUpdates.getChatId());
        }

        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    @Transactional
    public String assignUserToTeam(Long userId, Long teamId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        user.setTeam(team);
        user.setTeamRole(role);
        userRepository.save(user);

        return "User " + user.getNombre() + " assigned to team " + team.getNombre() + " as " + role;
    }

    public Team getUserTeam(User user) {
        if (user == null || user.getTeam() == null) {
            return null;
        }

        Team team = user.getTeam();
        return team;
    }
}