package com.springboot.MyTodoList.model;

import javax.persistence.*;

@Entity
@Table(name = "Tasks", schema = "TODOUSER")
public class Task {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "TaskID")
	private Long taskID;

	@ManyToOne
	@JoinColumn(name = "TeamID", nullable = false)
	private Team team;

	@ManyToOne
	@JoinColumn(name = "RoleID", nullable = false)
	private TeamRole role;

	@Column(name = "Title", nullable = false, length = 255)
	private String title;

	@Column(name = "Description", length = 2000)
	private String description;

	@Column(name = "Status", length = 50)
	private String status;

	@Column(name = "Priority", length = 50)
	private String priority;

	@Column(name = "FechaCreacion", nullable = false)
	private java.sql.Date fechaCreacion;

	@Column(name = "FechaInicio")
	private java.sql.Date fechaInicio;

	@Column(name = "FechaFin")
	private java.sql.Date fechaFin;

	@Column(name = "StoryPoints")
	private Long storyPoints;

	@Column(name = "TiempoInvertido")
	private Long tiempoInvertido;

	public Long getTaskID() {
		return taskID;
	}

	public void setTaskID(Long taskID) {
		this.taskID = taskID;
	}

	public Team getTeam() {
		return team;
	}

	public void setTeam(Team team) {
		this.team = team;
	}

	public TeamRole getRole() {
		return role;
	}

	public void setRole(TeamRole role) {
		this.role = role;
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

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
	}

	public java.sql.Date getFechaCreacion() {
		return fechaCreacion;
	}

	public void setFechaCreacion(java.sql.Date fechaCreacion) {
		this.fechaCreacion = fechaCreacion;
	}

	public java.sql.Date getFechaInicio() {
		return fechaInicio;
	}

	public void setFechaInicio(java.sql.Date fechaInicio) {
		this.fechaInicio = fechaInicio;
	}

	public java.sql.Date getFechaFin() {
		return fechaFin;
	}

	public void setFechaFin(java.sql.Date fechaFin) {
		this.fechaFin = fechaFin;
	}

	public Long getStoryPoints() {
		return storyPoints;
	}

	public void setStoryPoints(Long storyPoints) {
		this.storyPoints = storyPoints;
	}

	public Long getTiempoInvertido() {
		return tiempoInvertido;
	}

	public void setTiempoInvertido(Long tiempoInvertido) {
		this.tiempoInvertido = tiempoInvertido;
	}
}
