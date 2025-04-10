package com.springboot.MyTodoList.repository;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import com.springboot.MyTodoList.model.User;

import java.sql.ResultSet;
import java.sql.SQLException;
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

        @SqlUpdate("UPDATE users set telegramId = null WHERE telegramId = :chatId")
        int forgetChatId(@Bind("chatId") long chatId);

        @SqlQuery("SELECT * FROM users WHERE users.telegramId = :chatId")
        Optional<User> findByChatId(@Bind("chatId") long chatId);

        @SqlUpdate("UPDATE users SET telegramId = :chatId WHERE id = :id")
        int setChatIdForUser(@Bind("id") long id, @Bind("chatId") long chatId);

        @SqlQuery("SELECT u.*, t.name as team_name FROM users u " +
                        "LEFT JOIN teams t ON u.team_id = t.id " +
                        "WHERE u.email = :email")
        Optional<User> findByEmail(@Bind("email") String email);

        @SqlQuery("SELECT COUNT(*) > 0 FROM users WHERE email = :email")
        boolean existsByEmail(@Bind("email") String email);

        class UserMapper implements RowMapper<User> {

                @Override
                public User map(ResultSet rs, StatementContext ctx) throws SQLException {
                        User user = new User();
                        user.setId(rs.getLong("id"));
                        user.setName(rs.getString("name"));
                        user.setEmail(rs.getString("email"));

                        try {
                                user.setPassword(rs.getString("password"));
                        } catch (SQLException e) {
                                user.setPassword(null);
                        }

                        user.setRole(rs.getString("role"));
                        user.setTelegramId(rs.getLong("telegramId"));

                        try {
                                Long teamId = rs.getObject("team_id", Long.class);
                                if (!rs.wasNull()) {
                                        user.setTeamId(teamId);
                                }
                        } catch (SQLException e) {
                                user.setTeamId(null);
                        }

                        try {
                                user.setTeamRole(rs.getString("team_role"));
                        } catch (SQLException e) {
                                user.setTeamRole(null);
                        }

                        try {
                                String teamName = rs.getString("team_name");
                                if (!rs.wasNull()) {
                                        user.setTeamName(teamName);
                                }
                        } catch (SQLException e) {
                                user.setTeamName(null);
                        }

                        return user;
                }
        }
}
