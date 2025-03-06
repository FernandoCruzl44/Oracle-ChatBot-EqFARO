package com.springboot.MyTodoList.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.TeamRole;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private TeamRepository teamRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeamRoleRepository teamRoleRepository;

	public Task createTask(Task task) {
		return taskRepository.save(task);
	}

	// Returns a List<Task> with the tasks in the team, or null if
	// the team does not exist.
	@Transactional
	public List<Task> getTasksByTeam(Team team) {
		Optional<Team> team_op = teamRepository.findById(team.getTeamID());
		if (team_op.isPresent()) {
			return taskRepository.findByTeam(team);
		}

		return null;
	}
		
	// Returns a List<Task> with the tasks in the team, or null if
	// the team does not exist.
	public List<Task> getTasksByTeam(Long teamID) {
		Optional<Team> team = teamRepository.findById(teamID);
		if (team.isPresent()) {
			return getTasksByTeam(team.get());
		}

		// This is an error condition, this means the team was not
		// found. Caller handles that as it pleases.
		return null;
	}

	public List<Task> getTasksByRole(TeamRole role) {
		return taskRepository.findByRole(role);
	}

	public List<Task> getTasksByUser(User user) {
		Optional<TeamRole> role = teamRoleRepository.findByAssignedUser(user);
		if (role.isPresent()) {
			return getTasksByRole(role.get());
		}
		return null;
	}

	public List<Task> getTasksByUser(Long userID) {
		Optional<User> user = userRepository.findById(userID);
		if (user.isPresent()) {
			return getTasksByUser(user.get());
		}
		
		return null;
	}
}
