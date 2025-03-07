package com.springboot.MyTodoList.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Task;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Method 1: Using the task entity directly (preferred approach)
    List<Comment> findByTask(Task task);

    // Method 2: Using a JOIN query to find by task ID
    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId")
    List<Comment> findByTaskId(@Param("taskId") Long taskId);

    // Find comments by the user who created them
    List<Comment> findByCreatorId(Long userId);
}