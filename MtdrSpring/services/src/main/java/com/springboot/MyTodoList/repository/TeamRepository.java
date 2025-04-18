package com.springboot.MyTodoList.repository;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.model.User;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface TeamRepository {

        @SqlQuery("SELECT * FROM teams WHERE id = :id")
        Optional<Team> findById(@Bind("id") Long id);

        @SqlQuery("SELECT * FROM teams ORDER BY id " +
                        "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY")
        List<Team> findAll(@Bind("limit") int limit, @Bind("offset") int offset);

        @SqlQuery("SELECT u.*, t.name as team_name FROM users u " +
                        "LEFT JOIN teams t ON u.team_id = t.id " +
                        "WHERE u.team_id = :teamId")
        List<User> findMembersByTeamId(@Bind("teamId") Long teamId);

        @SqlQuery("SELECT t.* FROM teams t WHERE t.id IN (SELECT DISTINCT team_id FROM users WHERE team_id IS NOT NULL AND id = :userId)")
        @RegisterBeanMapper(Team.class)
        List<Team> findTeamsByUserId(@Bind("userId") Long userId);

        @SqlUpdate("INSERT INTO teams (name, description) VALUES (:name, :description)")
        @GetGeneratedKeys("id")
        Long insert(@BindBean Team team);

        @SqlUpdate("UPDATE teams SET name = :name, description = :description WHERE id = :id")
        int update(@BindBean Team team);

        @SqlUpdate("UPDATE users SET team_id = NULL, team_role = NULL WHERE team_id = :teamId")
        int unassignUsersFromTeam(@Bind("teamId") Long teamId);

        @SqlUpdate("DELETE FROM teams WHERE id = :id")
        int delete(@Bind("id") Long id);

        class TeamMapper implements RowMapper<Team> {

                @Override
                public Team map(ResultSet rs, StatementContext ctx) throws SQLException {
                        Team team = new Team();
                        team.setId(rs.getLong("id"));
                        team.setName(rs.getString("name"));
                        team.setDescription(rs.getString("description"));
                        return team;
                }
        }
}