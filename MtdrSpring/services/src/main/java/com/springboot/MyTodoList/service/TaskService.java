// /src/main/java/com/springboot/MyTodoList/service/TaskService.java
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

		// Revisar si un usuario es un manager primero
		boolean isManager = "manager".equals(currentUser.getRole());

		// Caso para los managers cuando ven todas las tareas
		if (isManager && ("assigned".equals(viewMode) || viewMode == null) && teamId == null) {
			return taskRepository.findAllTasksForManager(
					status, tag, assignedTo, createdBy,
					PageRequest.of(skip / limit, limit));
		}

		// Modos de vista para tabla de tareas
		if (viewMode != null) {
			if ("assigned".equals(viewMode)) {
				// Tareas asignadas al usuario actual
				return taskRepository.findByAssigneesId(currentUser.getId());
			} else if ("team".equals(viewMode)) {
				if (teamId != null) {
					// Tareas para el equipo especificado (para los managers que seleccionan un
					// equipo específico)
					return taskRepository.findByTeamId(teamId);
				} else if (currentUser.getTeam() != null) {
					// Tareas para el equipo del usuario (para usuarios regulares)
					return taskRepository.findByTeamId(currentUser.getTeam().getId());
				}
			}
		}

		if (isManager) {
			// Si el usuario es un manager, puede ver todas las tareas con filtros
			return taskRepository.findWithFilters(
					teamId, status, tag, assignedTo, createdBy,
					PageRequest.of(skip / limit, limit));
		} else {
			// Desarrolladores solo pueden ver tareas para su equipo
			Long userTeamId = currentUser.getTeam() != null ? currentUser.getTeam().getId() : null;
			if (userTeamId == null) {
				return new ArrayList<>();
			}

			if (teamId != null && !teamId.equals(userTeamId)) {
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

		// Managers pueden acceder a cualquier tarea
		if ("manager".equals(currentUser.getRole())) {
			return Optional.of(task);
		}

		// Para devs, verificar si la tarea pertenece a su equipo
		if (currentUser.getTeam() != null && task.getTeam() != null &&
				currentUser.getTeam().getId().equals(task.getTeam().getId())) {
			return Optional.of(task);
		}

		// Verificar si el usuario está asignado a la tarea
		if (task.getAssignees() != null &&
				task.getAssignees().stream().anyMatch(user -> user.getId().equals(currentUser.getId()))) {
			return Optional.of(task);
		}

		// El usuario no tiene acceso a la tarea
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
