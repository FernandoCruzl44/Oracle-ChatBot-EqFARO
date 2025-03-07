// File: /services/src/main/java/com/springboot/MyTodoList/service/TaskService.java
package com.springboot.MyTodoList.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.repository.UserRepository;

@Service
public class TaskService {

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeamRepository teamRepository;

	@Transactional
	public Task createTask(Task task, Long creatorId, Long teamId, List<Long> assigneeIds) {
		User creator = userRepository.findById(creatorId)
				.orElseThrow(() -> new RuntimeException("Creator user not found"));

		task.setCreator(creator);

		if (teamId != null) {
			Team team = teamRepository.findById(teamId)
					.orElseThrow(() -> new RuntimeException("Team not found"));
			task.setTeam(team);
		}

		task.setCreatedAt(new Date());

		if (task.getStatus() == null) {
			task.setStatus("Backlog");
		}

		Task savedTask = taskRepository.save(task);

		if (assigneeIds != null && !assigneeIds.isEmpty()) {
			List<User> assignees = userRepository.findAllById(assigneeIds);
			savedTask.setAssignees(assignees);
			savedTask = taskRepository.save(savedTask);
		}

		return savedTask;
	}

	public List<Task> getTasks(User currentUser, String viewMode, Long teamId, String status,
			String tag, Long assignedTo, Long createdBy, int skip, int limit) {

		// Check if user is a manager first
		boolean isManager = "manager".equals(currentUser.getRole());

		// Special case for managers viewing all tasks
		if (isManager && ("assigned".equals(viewMode) || viewMode == null) && teamId == null) {
			// Return all tasks for the manager (across all teams)
			return taskRepository.findAllTasksForManager(
					status, tag, assignedTo, createdBy,
					PageRequest.of(skip / limit, limit));
		}

		// Handle other view modes
		if (viewMode != null) {
			if ("assigned".equals(viewMode)) {
				// Return tasks assigned to the current user
				return taskRepository.findByAssigneesId(currentUser.getId());
			} else if ("team".equals(viewMode)) {
				if (teamId != null) {
					// Return tasks for the specified team (for managers selecting a specific team)
					return taskRepository.findByTeamId(teamId);
				} else if (currentUser.getTeam() != null) {
					// Return tasks for the user's team (for regular users)
					return taskRepository.findByTeamId(currentUser.getTeam().getId());
				}
			}
		}

		// Apply filters
		if (isManager) {
			// Managers can see all tasks with filters
			return taskRepository.findWithFilters(
					teamId, status, tag, assignedTo, createdBy,
					PageRequest.of(skip / limit, limit));
		} else {
			// Developers can only see tasks for their team
			Long userTeamId = currentUser.getTeam() != null ? currentUser.getTeam().getId() : null;
			if (userTeamId == null) {
				return new ArrayList<>();
			}

			// Override teamId with user's team for security
			if (teamId != null && !teamId.equals(userTeamId)) {
				// User tried to access another team's tasks
				return new ArrayList<>();
			}

			return taskRepository.findWithFilters(
					userTeamId, status, tag, assignedTo, createdBy,
					PageRequest.of(skip / limit, limit));
		}
	}

	public Optional<Task> getTask(Long taskId, User currentUser) {
		Optional<Task> taskOpt = taskRepository.findById(taskId);

		if (!taskOpt.isPresent()) {
			return Optional.empty();
		}

		Task task = taskOpt.get();

		// Managers can access any task
		if ("manager".equals(currentUser.getRole())) {
			return Optional.of(task);
		}

		// For developers, check if the task belongs to their team
		if (currentUser.getTeam() != null && task.getTeam() != null &&
				currentUser.getTeam().getId().equals(task.getTeam().getId())) {
			return Optional.of(task);
		}

		// Check if the user is assigned to the task
		if (task.getAssignees() != null &&
				task.getAssignees().stream().anyMatch(user -> user.getId().equals(currentUser.getId()))) {
			return Optional.of(task);
		}

		// User doesn't have access
		return Optional.empty();
	}

	@Transactional
	public Task updateTask(Task task, List<Long> assigneeIds) {
		if (assigneeIds != null) {
			List<User> assignees = userRepository.findAllById(assigneeIds);
			task.setAssignees(assignees);
		}

		return taskRepository.save(task);
	}

	@Transactional
	public void deleteTask(Long taskId) {
		taskRepository.deleteById(taskId);
	}

	@Transactional
	public Task updateTaskStatus(Long taskId, String status) {
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task not found"));

		task.setStatus(status);

		return taskRepository.save(task);
	}

	@Transactional
	public Task assignTask(Long taskId, List<Long> assigneeIds) {
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task not found"));

		if (assigneeIds != null) {
			List<User> assignees = userRepository.findAllById(assigneeIds);
			task.setAssignees(assignees);
		} else {
			task.setAssignees(new ArrayList<>());
		}

		return taskRepository.save(task);
	}

	@Transactional
	public void deleteMultipleTasks(List<Long> taskIds) {
		taskRepository.deleteAllById(taskIds);
	}
}
