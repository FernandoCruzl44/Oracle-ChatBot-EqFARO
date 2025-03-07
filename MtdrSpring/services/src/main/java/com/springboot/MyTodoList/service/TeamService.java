// /src/main/java/com/springboot/MyTodoList/service/TeamService.java
package com.springboot.MyTodoList.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.repository.TeamRepository;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    public List<Team> getTeams(int skip, int limit) {
        return teamRepository.findAllByOrderByIdAsc(PageRequest.of(skip / limit, limit));
    }

    public Optional<Team> getTeam(Long teamId) {
        return teamRepository.findById(teamId);
    }

    @Transactional
    public Team updateTeam(Long teamId, Team teamUpdates) {
        Team existingTeam = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (teamUpdates.getNombre() != null) {
            existingTeam.setNombre(teamUpdates.getNombre());
        }

        if (teamUpdates.getDescription() != null) {
            existingTeam.setDescription(teamUpdates.getDescription());
        }

        return teamRepository.save(existingTeam);
    }

    @Transactional
    public void deleteTeam(Long teamId) {
        teamRepository.deleteById(teamId);
    }
}
