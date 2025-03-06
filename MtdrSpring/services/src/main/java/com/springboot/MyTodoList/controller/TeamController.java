package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.springboot.MyTodoList.service.TeamService;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Team;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @PostMapping
    public Team createTeam(@RequestBody Team team) {
        return teamService.createTeam(team);
    }

    @GetMapping("/manager/{managerId}")
    public List<Team> getTeamsByManager(@PathVariable Long managerId) {
        User manager = new User(); // Should fetch user by ID, simplified for this example
        manager.setUserID(managerId);
        return teamService.getTeamsByManager(manager);
    }

    @GetMapping("/name/{namePart}")
    public List<Team> getTeamsByName(@PathVariable String namePart) {
        return teamService.getTeamsByName(namePart);
    }
}
