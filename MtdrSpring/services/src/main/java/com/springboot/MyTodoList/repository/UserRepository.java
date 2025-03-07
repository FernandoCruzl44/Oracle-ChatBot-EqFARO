// File: /services/src/main/java/com/springboot/MyTodoList/repository/UserRepository.java
package com.springboot.MyTodoList.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.springboot.MyTodoList.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(String role);

    List<User> findByTeamId(Long teamId);

    List<User> findAllByOrderByIdAsc(Pageable pageable);
}
