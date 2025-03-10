package com.springboot.MyTodoList.repository.mapper;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import com.springboot.MyTodoList.model.Task;

import java.sql.ResultSet;
import java.sql.SQLException;

public class TaskMapper implements RowMapper<Task> {

    @Override
    public Task map(ResultSet rs, StatementContext ctx) throws SQLException {
        Task task = new Task();
        task.setId(rs.getLong("id"));
        task.setTitle(rs.getString("title"));
        task.setDescription(rs.getString("description"));
        task.setTag(rs.getString("tag"));
        task.setStatus(rs.getString("status"));
        task.setStartDate(rs.getString("start_date"));
        task.setEndDate(rs.getString("end_date"));
        task.setCreatorId(rs.getLong("created_by_id"));
        task.setCreatorName(rs.getString("creator_name"));

        // Handle nullable fields
        Long teamId = rs.getObject("team_id", Long.class);
        if (!rs.wasNull()) {
            task.setTeamId(teamId);
        }

        task.setTeamName(rs.getString("team_name"));

        return task;
    }
}