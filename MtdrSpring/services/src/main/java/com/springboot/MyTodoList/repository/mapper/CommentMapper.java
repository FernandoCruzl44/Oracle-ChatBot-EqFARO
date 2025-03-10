package com.springboot.MyTodoList.repository.mapper;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import com.springboot.MyTodoList.model.Comment;

import java.sql.ResultSet;
import java.sql.SQLException;

public class CommentMapper implements RowMapper<Comment> {

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