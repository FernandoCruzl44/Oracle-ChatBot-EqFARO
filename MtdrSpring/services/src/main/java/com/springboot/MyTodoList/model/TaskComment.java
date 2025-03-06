package com.springboot.MyTodoList.model;

import javax.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "TaskComment", schema = "TODOUSER")
public class TaskComment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "COMMENTID")
	private Long commentID;

	@ManyToOne
	@JoinColumn(name = "TASKID", nullable = false)
	private Task task;

	@ManyToOne
	@JoinColumn(name = "USERID", nullable = false)
	private User user;

	@Column(name = "CREATIONTIME", columnDefinition = "TIMESTAMP DEFAULT SYSTIMESTAMP")
	private Timestamp creationTime;

	@Column(name = "COMMENTTEXT", length = 1000)
	private String commentText;

	public Long getCommentID() {
		return commentID;
	}

	public void setCommentID(Long commentID) {
		this.commentID = commentID;
	}

	public Task getTask() {
		return task;
	}

	public void setTask(Task task) {
		this.task = task;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public Timestamp getCreationTime() {
		return creationTime;
	}

	public void setCreationTime(Timestamp creationTime) {
		this.creationTime = creationTime;
	}

	public String getCommentText() {
		return commentText;
	}

	public void setCommentText(String commentText) {
		this.commentText = commentText;
	}
}
