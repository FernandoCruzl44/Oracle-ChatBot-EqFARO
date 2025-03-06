package com.springboot.MyTodoList.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamRole;
import com.springboot.MyTodoList.model.Task;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByTeam(Team team);

	List<Task> findByRole(TeamRole role);
}
