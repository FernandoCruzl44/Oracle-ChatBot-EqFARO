package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamRole;
import com.springboot.MyTodoList.service.TeamRoleService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/teamroles")
public class TeamRoleController {

    @Autowired
    private TeamRoleService teamRoleService;

    @PostMapping
    public TeamRole createTeamRole(@RequestBody TeamRole teamRole) {
        return teamRoleService.createTeamRole(teamRole);
    }

    @GetMapping("/team/{teamId}")
    public List<TeamRole> getRolesByTeam(@PathVariable Long teamId) {
        Team team = new Team(); // Simplified for this example
        team.setTeamID(teamId);
        return teamRoleService.getRolesByTeam(team);
    }

    @GetMapping("/user/{userId}")
    public Optional<TeamRole> getRoleByAssignedUser(@PathVariable Long userId) {
        User user = new User(); // Simplified for this example
        user.setId(userId);
        return teamRoleService.getRoleByAssignedUser(user);
    }
}
