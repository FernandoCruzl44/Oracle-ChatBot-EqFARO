// /src/main/java/com/springboot/MyTodoList/repository/CommentRepository.java
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
    List<Comment> findByTask(Task task);

    @Query("SELECT c FROM Comment c WHERE c.task.id = :taskId")
    List<Comment> findByTaskId(@Param("taskId") Long taskId);

    List<Comment> findByCreatorId(Long userId);
}