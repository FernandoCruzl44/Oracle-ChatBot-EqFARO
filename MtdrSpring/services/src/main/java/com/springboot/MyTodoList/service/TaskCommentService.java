package com.springboot.MyTodoList.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.springboot.MyTodoList.model.TaskComment;
import com.springboot.MyTodoList.repository.TaskCommentRepository;

import java.util.List;

@Service
public class TaskCommentService {

	@Autowired
	private TaskCommentRepository taskCommentRepository;

	public List<TaskComment> getCommentsByTask(Long taskID) {
		return taskCommentRepository.findByTaskTaskID(taskID);
	}

	public List<TaskComment> getCommentsByUser(Long userID) {
		return taskCommentRepository.findByUserUserID(userID);
	}

	public TaskComment createComment(TaskComment comment) {
		return taskCommentRepository.save(comment);
	}
}
