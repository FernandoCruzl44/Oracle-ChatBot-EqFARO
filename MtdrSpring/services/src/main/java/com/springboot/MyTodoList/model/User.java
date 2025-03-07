package com.springboot.MyTodoList.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;

@Entity
@Table(name = "Users", schema = "TODOUSER")
public class User {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY) 
        @Column(name = "USERID") // Explicitly mapping the column name in the database
        private Long id;

        @Column(name = "NOMBRE", nullable = false, length = 255) // Mapping to 'Nombre' column
        private String nombre;

        @Column(name = "EMAIL", nullable = false, unique = true, length = 255) // 'Email' should be unique
        private String email;

        @Column(name = "TELEGRAMID", length = 255) // 'TelegramID' can be nullable
        private String telegramID;

        @Column(name = "CHATID", length = 255) // 'ChatID' can be nullable
        private String chatID;

        @Column(name = "PHONE", length = 255) // 'Phone' can be nullable
        private String phone;

        @Column(name = "USERTYPE", nullable = false, length = 20) // Enforcing non-null constraint on 'UserType'
        private String role;

        public Long getId() {
                return id;
        }

        public void setId(Long userID) {
                this.id = userID;
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

        public String getTelegramID() {
                return telegramID;
        }

        public void setTelegramID(String telegramID) {
                this.telegramID = telegramID;
        }

        public String getChatID() {
                return chatID;
        }

        public void setChatID(String chatID) {
                this.chatID = chatID;
        }

        public String getPhone() {
                return phone;
        }

        public void setPhone(String phone) {
                this.phone = phone;
        }

        public String getRole() {
                return role;
        }

        public void setRole(String userType) {
                this.role = userType;
        }
}
