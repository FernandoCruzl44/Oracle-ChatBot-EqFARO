package com.springboot.MyTodoList.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.springboot.MyTodoList.model.TaskComment;

import java.util.List;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
    List<TaskComment> findByTaskTaskID(Long taskID);
    List<TaskComment> findByUserUserID(Long userID);
}
