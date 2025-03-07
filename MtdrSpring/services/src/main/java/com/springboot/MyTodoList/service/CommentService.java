package com.springboot.MyTodoList.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.UserRepository;

@Service
public class CommentService {

	@Autowired
	private CommentRepository commentRepository;

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private UserRepository userRepository;

	@Transactional
	public Comment createComment(Long taskId, String content, Long creatorId) {
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task not found"));

		User creator = userRepository.findById(creatorId)
				.orElseThrow(() -> new RuntimeException("User not found"));

		Comment comment = new Comment();
		comment.setTask(task);
		comment.setCreator(creator);
		comment.setContent(content);
		comment.setCreatedAt(new Date());

		return commentRepository.save(comment);
	}

	public List<Comment> getCommentsByTask(Long taskId) {
		return commentRepository.findByTaskId(taskId);
	}

	@Transactional
	public void deleteComment(Long commentId) {
		commentRepository.deleteById(commentId);
	}
}
