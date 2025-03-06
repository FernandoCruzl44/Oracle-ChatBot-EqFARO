package com.springboot.MyTodoList.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamRole;
import com.springboot.MyTodoList.repository.TeamRoleRepository;

import java.util.List;
import java.util.Optional;


@Service
public class TeamRoleService {

    @Autowired
    private TeamRoleRepository teamRoleRepository;

    public TeamRole createTeamRole(TeamRole teamRole) {
        return teamRoleRepository.save(teamRole);
    }

    public List<TeamRole> getRolesByTeam(Team team) {
        return teamRoleRepository.findByTeam(team);
    }

    public Optional<TeamRole> getRoleByAssignedUser(User user) {
        return teamRoleRepository.findByAssignedUser(user);
    }
}
