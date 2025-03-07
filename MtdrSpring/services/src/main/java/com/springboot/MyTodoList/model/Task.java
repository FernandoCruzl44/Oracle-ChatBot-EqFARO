// /src/main/java/com/springboot/MyTodoList/model/Task.java
package com.springboot.MyTodoList.model;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "tasks")
public class Task {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id;

	@Column(name = "title", nullable = false)
	private String title;

	@Column(name = "description")
	private String description;

	@Column(name = "tag", nullable = false)
	private String tag;

	@Column(name = "status", nullable = false)
	private String status; // "Backlog", "En progreso", "Completada", "Cancelada"

	@Column(name = "start_date", nullable = false)
	private String startDate;

	@Column(name = "end_date")
	private String endDate;

	@ManyToOne
	@JoinColumn(name = "created_by_id", nullable = false)
	@JsonIgnoreProperties({ "createdTasks", "assignedTasks" })
	private User creator;

	@ManyToOne
	@JoinColumn(name = "team_id")
	@JsonIgnore // Esconder el equipo en la respuesta JSON, para evitar loop al serializar
	private Team team;

	@ManyToMany
	@JoinTable(name = "task_assignee", joinColumns = @JoinColumn(name = "task_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
	@JsonIgnoreProperties({ "createdTasks", "assignedTasks" })
	private List<User> assignees;

	@OneToMany(mappedBy = "task", cascade = CascadeType.ALL)
	@JsonIgnoreProperties("task")
	private List<Comment> comments;

	@Column(name = "created_at")
	private Date createdAt;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getTag() {
		return tag;
	}

	public void setTag(String tag) {
		this.tag = tag;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getStartDate() {
		return startDate;
	}

	public void setStartDate(String startDate) {
		this.startDate = startDate;
	}

	public String getEndDate() {
		return endDate;
	}

	public void setEndDate(String endDate) {
		this.endDate = endDate;
	}

	public User getCreator() {
		return creator;
	}

	public void setCreator(User creator) {
		this.creator = creator;
	}

	@JsonProperty("team")
	public String getTeamName() {
		return team != null ? team.getNombre() : null;
	}

	public Team getTeam() {
		return team;
	}

	public void setTeam(Team team) {
		this.team = team;
	}

	public Date getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Date createdAt) {
		this.createdAt = createdAt;
	}

	public List<User> getAssignees() {
		return assignees;
	}

	public void setAssignees(List<User> assignees) {
		this.assignees = assignees;
	}

	public List<Comment> getComments() {
		return comments;
	}

	public void setComments(List<Comment> comments) {
		this.comments = comments;
	}
}