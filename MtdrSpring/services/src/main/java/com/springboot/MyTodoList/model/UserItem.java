package com.springboot.MyTodoList.model;


import javax.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = User)
public class UserItem{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int UserID;
    @Column(name = "Nombre")
    String Nombre;
    @Column(name = "Rol")
    String Rol;
    @Column(name = "Email")
    String Email;
    @Column(name = "TelegramID")
    String TelegramID;
    @Column(name = "ChatID")
    String ChatID;
    @Column(name = "Phone")
    String Phone;

    public UserItem(){
        
    }

    public UserItem(int UserID, String Nombre, String Rol, String Email, String TelegramID, String ChatID, String Phone){
        this.UserID = UserID;
        this.Nombre = Nombre;
        this.Rol = Rol;
        this.Email = Email;
        this.TelegramID = TelegramID;
        this.ChatID = ChatID;
        this.Phone = Phone;
    }

    public int getUserID() {
        return UserID;
    }

    public void setUserID(int UserID) {
        this.UserID = UserID;
    }

    public String getNombre() {
        return Nombre;
    }

    public void setNombre(String Nombre) {
        this.Nombre = Nombre;
    }

    public String getRol() {
        return Rol;
    }

    public void setRol(String Rol) {
        this.Rol = Rol;
    }

    public String getEmail() {
        return Email;
    }

    public void setEmail(String Email) {
        this.Email = Email;
    }

    public String getTelegramID() {
        return TelegramID;
    }

    public void setTelegramID(String TelegramID) {
        this.TelegramID = TelegramID;
    }

    public String getChatID() {
        return ChatID;
    }

    public void setChatID(String ChatID) {
        this.ChatID = ChatID;
    }

    public String getPhone() {
        return Phone;
    }

    public void setPhone(String Phone) {
        this.Phone = Phone;
    }

    @Override
    public String toString() {
        return "UserItem{" +
                "UserID=" + UserID +
                ", Nombre='" + Nombre + '\'' +
                ", Rol='" + Rol + '\'' +
                ", Email='" + Email + '\'' +
                ", TelegramID='" + TelegramID + '\'' +
                ", ChatID='" + ChatID + '\'' +
                ", Phone='" + Phone + '\'' +
                '}';
    }


}