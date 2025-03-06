package com.springboot.MyTodoList.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.MyTodoList.model.User;


public interface UserRepository extends JpaRepository<User, Long> {
    // Custom query to find users by userType
    List<User> findByUserType(String userType);
    
    // Custom query to find a user by email
    Optional<User> findByEmail(String email);
}
