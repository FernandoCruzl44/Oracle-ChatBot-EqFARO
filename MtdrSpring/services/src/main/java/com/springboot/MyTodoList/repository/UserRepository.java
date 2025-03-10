package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import com.springboot.MyTodoList.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {

        @SqlQuery("SELECT u.*, t.name as team_name FROM users u " +
                        "LEFT JOIN teams t ON u.team_id = t.id " +
                        "WHERE u.id = :id")
        Optional<User> findById(@Bind("id") Long id);

        @SqlQuery("SELECT u.*, t.name as team_name FROM users u " +
                        "LEFT JOIN teams t ON u.team_id = t.id " +
                        "ORDER BY u.id " +
                        "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY")
        List<User> findAll(@Bind("limit") int limit, @Bind("offset") int offset);

        @SqlQuery("SELECT u.*, t.name as team_name FROM users u " +
                        "LEFT JOIN teams t ON u.team_id = t.id " +
                        "WHERE u.team_id = :teamId")
        List<User> findByTeamId(@Bind("teamId") Long teamId);

        @SqlUpdate("INSERT INTO users (name, email, password, role, telegramId, team_id, team_role) " +
                        "VALUES (:name, :email, :password, :role, :telegramId, :teamId, :teamRole)")
        @GetGeneratedKeys("id")
        Long insert(@BindBean User user);

        @SqlUpdate("UPDATE users SET name = :name, email = :email, " +
                        "role = :role, telegramId = :telegramId, " +
                        "team_id = :teamId, team_role = :teamRole " +
                        "WHERE id = :id")
        int update(@BindBean User user);

        @SqlUpdate("DELETE FROM users WHERE id = :id")
        int delete(@Bind("id") Long id);
}