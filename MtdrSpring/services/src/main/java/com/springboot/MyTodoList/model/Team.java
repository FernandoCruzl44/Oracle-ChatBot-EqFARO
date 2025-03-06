package com.springboot.MyTodoList.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "Teams", schema = "TODOUSER")
public class Team {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "TeamID")
	private Long teamID;

	@ManyToOne
	@JoinColumn(name = "ManagerID", nullable = false)
	private User manager;

	@Column(name = "Nombre", nullable = false, length = 255)
	private String nombre;

	@Column(name = "Description", length = 255)
	private String description;

	public Long getTeamID() {
		return teamID;
	}

	public void setTeamID(Long teamID) {
		this.teamID = teamID;
	}

	public User getManager() {
		return manager;
	}

	public void setManager(User manager) {
		this.manager = manager;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}
}
