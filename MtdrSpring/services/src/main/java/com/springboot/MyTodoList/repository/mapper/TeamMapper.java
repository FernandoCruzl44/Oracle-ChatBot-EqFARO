package com.springboot.MyTodoList.repository.mapper;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import com.springboot.MyTodoList.model.Team;

import java.sql.ResultSet;
import java.sql.SQLException;

public class TeamMapper implements RowMapper<Team> {

    @Override
    public Team map(ResultSet rs, StatementContext ctx) throws SQLException {
        Team team = new Team();
        team.setId(rs.getLong("id"));
        team.setName(rs.getString("name"));
        team.setDescription(rs.getString("description"));
        return team;
    }
}