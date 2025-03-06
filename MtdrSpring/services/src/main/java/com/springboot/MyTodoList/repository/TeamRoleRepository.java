package com.springboot.MyTodoList.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamRole;

import java.util.List;
import java.util.Optional;


public interface TeamRoleRepository extends JpaRepository<TeamRole, Long> {
    List<TeamRole> findByTeam(Team team);
    Optional<TeamRole> findByAssignedUser(User user);
}
