package com.springboot.MyTodoList.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;


import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Team;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    public List<Team> getTeamsByManager(User manager) {
        return teamRepository.findByManager(manager);
    }

    public List<Team> getTeamsByName(String namePart) {
        return teamRepository.findByNombreContaining(namePart);
    }
}
