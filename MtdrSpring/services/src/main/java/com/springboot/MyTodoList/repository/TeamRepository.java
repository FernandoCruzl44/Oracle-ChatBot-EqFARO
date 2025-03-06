package com.springboot.MyTodoList.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;

import java.util.List;


public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByManager(User manager);
    List<Team> findByNombreContaining(String namePart);
}
