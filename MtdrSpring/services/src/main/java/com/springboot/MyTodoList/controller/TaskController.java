package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.TaskService;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	@Autowired
	private TaskService taskService;

	@PostMapping
	public Task createTask(@RequestBody Task task) {
		return taskService.createTask(task);
	}

	@GetMapping("/team/{teamID}")
	public List<Task> getTasksByTeam(@PathVariable Long teamID) {
		return taskService.getTasksByTeam(teamID);
	}

	@GetMapping("/user/{userID}")
	public List<Task> getTasksByUser(@PathVariable Long userID) {
		List<Task> tasks = taskService.getTasksByUser(userID);

		// If user is not assigned anywhere, just return no tasks
		if (tasks == null) {
			return new ArrayList<>(0);
		}
		return tasks;
	}
}
