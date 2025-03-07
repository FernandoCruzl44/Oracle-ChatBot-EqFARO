package com.springboot.MyTodoList.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.CommentService;
import com.springboot.MyTodoList.service.IdentityService;
import com.springboot.MyTodoList.service.TaskService;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	@Autowired
	private TaskService taskService;

	@Autowired
	private CommentService commentService;

	@Autowired
	private IdentityService identityService;

	@PostMapping
	public ResponseEntity<?> createTask(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
		User currentUser = identityService.getCurrentUser(httpRequest);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = new Task();
		task.setTitle((String) request.get("title"));
		task.setDescription((String) request.get("description"));
		task.setTag((String) request.get("tag"));
		task.setStatus((String) request.get("status"));
		task.setStartDate((String) request.get("startDate"));
		task.setEndDate((String) request.get("endDate"));

		Long teamId = null;
		if (request.containsKey("team_id")) {
			teamId = Long.valueOf(request.get("team_id").toString());
		}

		// Fix type conversion for assignee_ids
		List<Long> assigneeIds = null;
		if (request.containsKey("assignee_ids") && request.get("assignee_ids") != null) {
			@SuppressWarnings("unchecked")
			List<Object> rawIds = (List<Object>) request.get("assignee_ids");
			assigneeIds = rawIds.stream()
					.map(id -> Long.valueOf(id.toString()))
					.collect(Collectors.toList());
		}

		Task createdTask = taskService.createTask(task, currentUser.getId(), teamId, assigneeIds);

		return ResponseEntity.ok(createdTask);
	}

	@GetMapping
	public ResponseEntity<?> getTasks(
			@RequestParam(required = false) String view_mode,
			@RequestParam(required = false) Long team_id,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String tag,
			@RequestParam(required = false) Long assigned_to,
			@RequestParam(required = false) Long created_by,
			@RequestParam(defaultValue = "0") int skip,
			@RequestParam(defaultValue = "100") int limit,
			HttpServletRequest httpRequest) {

		User currentUser = identityService.getCurrentUser(httpRequest);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		List<Task> tasks = taskService.getTasks(
				currentUser, view_mode, team_id, status, tag, assigned_to, created_by, skip, limit);

		return ResponseEntity.ok(tasks);
	}

	@GetMapping("/{taskId}")
	public ResponseEntity<?> getTask(@PathVariable Long taskId, HttpServletRequest request) {
		User currentUser = identityService.getCurrentUser(request);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		return taskService.getTask(taskId, currentUser)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/{taskId}")
	public ResponseEntity<?> updateTask(
			@PathVariable Long taskId,
			@RequestBody Map<String, Object> request,
			HttpServletRequest httpRequest) {

		User currentUser = identityService.getCurrentUser(httpRequest);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = taskService.getTask(taskId, currentUser)
				.orElse(null);

		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		// Check access permissions
		if (!identityService.isManager(httpRequest) &&
				(task.getTeam() == null || !task.getTeam().getId().equals(currentUser.getTeam().getId()))) {
			return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
		}

		// Apply updates
		if (request.containsKey("title")) {
			task.setTitle((String) request.get("title"));
		}

		if (request.containsKey("description")) {
			task.setDescription((String) request.get("description"));
		}

		if (request.containsKey("tag")) {
			task.setTag((String) request.get("tag"));
		}

		if (request.containsKey("status")) {
			task.setStatus((String) request.get("status"));
		}

		if (request.containsKey("startDate")) {
			task.setStartDate((String) request.get("startDate"));
		}

		if (request.containsKey("endDate")) {
			task.setEndDate((String) request.get("endDate"));
		}

		// Fix type conversion for assignee_ids
		List<Long> assigneeIds = null;
		if (request.containsKey("assignee_ids") && request.get("assignee_ids") != null) {
			@SuppressWarnings("unchecked")
			List<Object> rawIds = (List<Object>) request.get("assignee_ids");
			assigneeIds = rawIds.stream()
					.map(id -> Long.valueOf(id.toString()))
					.collect(Collectors.toList());
		}

		Task updatedTask = taskService.updateTask(task, assigneeIds);

		return ResponseEntity.ok(updatedTask);
	}

	@DeleteMapping("/{taskId}")
	public ResponseEntity<?> deleteTask(@PathVariable Long taskId, HttpServletRequest request) {
		User currentUser = identityService.getCurrentUser(request);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = taskService.getTask(taskId, currentUser)
				.orElse(null);

		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		// TODO - No hay control de acceso en la eliminación de tareas

		taskService.deleteTask(taskId);

		return ResponseEntity.ok(Map.of("message", "Task deleted"));
	}

	@PutMapping("/{taskId}/status")
	public ResponseEntity<?> updateTaskStatus(
			@PathVariable Long taskId,
			@RequestBody Map<String, String> request,
			HttpServletRequest httpRequest) {

		User currentUser = identityService.getCurrentUser(httpRequest);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = taskService.getTask(taskId, currentUser)
				.orElse(null);

		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		// Check access permissions
		if (!identityService.isManager(httpRequest) &&
				(task.getTeam() == null || !task.getTeam().getId().equals(currentUser.getTeam().getId()))) {
			return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
		}

		String status = request.get("status");
		if (status == null) {
			return ResponseEntity.badRequest().body(Map.of("message", "Status is required"));
		}

		Task updatedTask = taskService.updateTaskStatus(taskId, status);

		return ResponseEntity.ok(updatedTask);
	}

	@PutMapping("/{taskId}/assign")
	public ResponseEntity<?> assignTask(
			@PathVariable Long taskId,
			@RequestBody Map<String, List<Object>> request,
			HttpServletRequest httpRequest) {

		User currentUser = identityService.getCurrentUser(httpRequest);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = taskService.getTask(taskId, currentUser)
				.orElse(null);

		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		// Check access permissions
		if (!identityService.isManager(httpRequest) &&
				(task.getTeam() == null || !task.getTeam().getId().equals(currentUser.getTeam().getId()))) {
			return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
		}

		List<Object> rawIds = request.get("assignee_ids");
		if (rawIds == null) {
			return ResponseEntity.badRequest().body(Map.of("message", "assignee_ids is required"));
		}

		// Fix type conversion
		List<Long> assigneeIds = rawIds.stream()
				.map(id -> Long.valueOf(id.toString()))
				.collect(Collectors.toList());

		Task updatedTask = taskService.assignTask(taskId, assigneeIds);

		return ResponseEntity.ok(updatedTask);
	}

	@DeleteMapping
	public ResponseEntity<?> deleteMultipleTasks(
			@RequestBody List<Long> taskIds,
			HttpServletRequest request) {

		User currentUser = identityService.getCurrentUser(request);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		// Check access permissions (only manager can delete multiple tasks)
		if (!identityService.isManager(request)) {
			return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
		}

		taskService.deleteMultipleTasks(taskIds);

		return ResponseEntity.ok(Map.of("message", "Tasks deleted"));
	}

	@PostMapping("/{taskId}/comments")
	public ResponseEntity<?> createComment(
			@PathVariable Long taskId,
			@RequestBody Map<String, String> request,
			HttpServletRequest httpRequest) {

		User currentUser = identityService.getCurrentUser(httpRequest);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = taskService.getTask(taskId, currentUser)
				.orElse(null);

		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		String content = request.get("content");
		if (content == null || content.trim().isEmpty()) {
			return ResponseEntity.badRequest().body(Map.of("message", "Content is required"));
		}

		Comment comment = commentService.createComment(taskId, content, currentUser.getId());

		return ResponseEntity.ok(comment);
	}

	@GetMapping("/{taskId}/comments")
	public ResponseEntity<?> getComments(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = identityService.getCurrentUser(request);
		if (currentUser == null) {
			return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
		}

		Task task = taskService.getTask(taskId, currentUser)
				.orElse(null);

		if (task == null) {
			return ResponseEntity.notFound().build();
		}

		List<Comment> comments = commentService.getCommentsByTask(taskId);

		return ResponseEntity.ok(comments);
	}
}
