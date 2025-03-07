// /src/main/java/com/springboot/MyTodoList/model/User.java
package com.springboot.MyTodoList.model;

import java.util.Date;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "users")
public class User {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "id")
        private Long id;

        @Column(name = "nombre", nullable = false)
        private String nombre;

        @Column(name = "email", nullable = false, unique = true)
        private String email;

        @Column(name = "password", nullable = false)
        private String password;

        @Column(name = "role", nullable = false)
        private String role; // "manager" or "developer"

        @Column(name = "telegramId")
        private String telegramId;

        @Column(name = "chatId")
        private String chatId;

        @Column(name = "created_at")
        private Date createdAt;

        @ManyToOne
        @JoinColumn(name = "team_id", nullable = true)
        @JsonIgnoreProperties({ "members", "tasks" })
        private Team team;

        @OneToMany(mappedBy = "creator")
        @JsonIgnoreProperties({ "creator", "assignees", "comments" })
        private List<Task> createdTasks;

        @ManyToMany(mappedBy = "assignees")
        @JsonIgnoreProperties({ "creator", "assignees", "comments" })
        private List<Task> assignedTasks;

        @Column(name = "team_role")
        private String teamRole; // TODO: "lead" or "miembro", cambiar a string que se pueda modificar

        public Long getId() {
                return id;
        }

        public void setId(Long id) {
                this.id = id;
        }

        public String getNombre() {
                return nombre;
        }

        public void setNombre(String nombre) {
                this.nombre = nombre;
        }

        public String getEmail() {
                return email;
        }

        public void setEmail(String email) {
                this.email = email;
        }

        public String getPassword() {
                return password;
        }

        public void setPassword(String password) {
                this.password = password;
        }

        public String getRole() {
                return role;
        }

        public void setRole(String role) {
                this.role = role;
        }

        public String getTelegramId() {
                return telegramId;
        }

        public void setTelegramId(String telegramId) {
                this.telegramId = telegramId;
        }

        public String getChatId() {
                return chatId;
        }

        public void setChatId(String chatId) {
                this.chatId = chatId;
        }

        public Date getCreatedAt() {
                return createdAt;
        }

        public void setCreatedAt(Date createdAt) {
                this.createdAt = createdAt;
        }

        public Team getTeam() {
                return team;
        }

        public void setTeam(Team team) {
                this.team = team;
        }

        public String getTeamRole() {
                return teamRole;
        }

        public void setTeamRole(String teamRole) {
                this.teamRole = teamRole;
        }

        public List<Task> getCreatedTasks() {
                return createdTasks;
        }

        public void setCreatedTasks(List<Task> createdTasks) {
                this.createdTasks = createdTasks;
        }

        public List<Task> getAssignedTasks() {
                return assignedTasks;
        }

        public void setAssignedTasks(List<Task> assignedTasks) {
                this.assignedTasks = assignedTasks;
        }
}
