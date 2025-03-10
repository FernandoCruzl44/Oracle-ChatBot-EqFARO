package com.springboot.MyTodoList.repository.mapper;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import com.springboot.MyTodoList.model.User;

import java.sql.ResultSet;
import java.sql.SQLException;

public class UserMapper implements RowMapper<User> {

    @Override
    public User map(ResultSet rs, StatementContext ctx) throws SQLException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));

        try {
            user.setPassword(rs.getString("password"));
        } catch (SQLException e) {
            // Password might not be selected in all queries
            user.setPassword(null);
        }

        user.setRole(rs.getString("role"));
        user.setTelegramId(rs.getString("telegramId"));

        // Handle nullable fields
        try {
            Long teamId = rs.getObject("team_id", Long.class);
            if (!rs.wasNull()) {
                user.setTeamId(teamId);
            }
        } catch (SQLException e) {
            // team_id might not be available
            user.setTeamId(null);
        }

        try {
            user.setTeamRole(rs.getString("team_role"));
        } catch (SQLException e) {
            // team_role might not be available
            user.setTeamRole(null);
        }

        try {
            String teamName = rs.getString("team_name");
            if (!rs.wasNull()) {
                user.setTeamName(teamName);
            }
        } catch (SQLException e) {
            // team_name might not be available
            user.setTeamName(null);
        }

        return user;
    }
}