package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import com.springboot.MyTodoList.model.Comment;

import java.util.List;
import java.util.Optional;

public interface CommentRepository {

        @SqlQuery("SELECT c.*, u.name as creator_name " +
                        "FROM comments c " +
                        "JOIN users u ON c.created_by_id = u.id " +
                        "WHERE c.task_id = :taskId " +
                        "ORDER BY c.created_at DESC")
        List<Comment> findByTaskId(@Bind("taskId") Long taskId);

        @SqlQuery("SELECT c.*, u.name as creator_name " +
                        "FROM comments c " +
                        "JOIN users u ON c.created_by_id = u.id " +
                        "WHERE c.id = :id")
        Optional<Comment> findById(@Bind("id") Long id);

        @SqlUpdate("INSERT INTO comments (task_id, content, created_by_id) " +
                        "VALUES (:taskId, :content, :creatorId)")
        @GetGeneratedKeys("id")
        Long insert(@BindBean Comment comment);

        @SqlUpdate("DELETE FROM comments WHERE id = :id")
        int delete(@Bind("id") Long id);
}