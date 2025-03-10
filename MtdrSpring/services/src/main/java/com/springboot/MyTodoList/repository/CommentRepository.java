package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import com.springboot.MyTodoList.model.Comment;

import java.sql.ResultSet;
import java.sql.SQLException;
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

        class CommentMapper implements RowMapper<Comment> {

                @Override
                public Comment map(ResultSet rs, StatementContext ctx) throws SQLException {
                        Comment comment = new Comment();
                        comment.setId(rs.getLong("id"));
                        comment.setTaskId(rs.getLong("task_id"));
                        comment.setContent(rs.getString("content"));
                        comment.setCreatorId(rs.getLong("created_by_id"));
                        comment.setCreatorName(rs.getString("creator_name"));
                        comment.setCreatedAt(rs.getTimestamp("created_at"));
                        return comment;
                }
        }
}