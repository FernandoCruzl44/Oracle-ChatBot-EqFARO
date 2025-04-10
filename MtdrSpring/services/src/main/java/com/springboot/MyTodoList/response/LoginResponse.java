package com.springboot.MyTodoList.response;

import com.springboot.MyTodoList.model.User;

import java.util.HashMap;
import java.util.Map;

public class LoginResponse {
    private String token;
    private long expiresIn;
    private Map<String, Object> user;

    public LoginResponse() {
        this.user = new HashMap<>();
    }

    public String getToken() {
        return token;
    }

    public LoginResponse setToken(String token) {
        this.token = token;
        return this;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public LoginResponse setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
        return this;
    }

    public Map<String, Object> getUser() {
        return user;
    }

    public LoginResponse setUser(User user) {
        this.user.put("id", user.getId());
        this.user.put("name", user.getName());
        this.user.put("email", user.getEmail());
        this.user.put("role", user.getRole());
        this.user.put("teamId", user.getTeamId());
        this.user.put("teamName", user.getTeamName());
        return this;
    }
}