package com.springboot.MyTodoList.repository;

import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.jdbi.v3.sqlobject.statement.UseRowMapper;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface TaskRepository {

        @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
                        "FROM tasks t " +
                        "LEFT JOIN users u ON t.created_by_id = u.id " + // Changed JOIN to LEFT JOIN for creator
                        "LEFT JOIN teams tm ON t.team_id = tm.id " +
                        "WHERE t.id = :id")
        Optional<Task> findById(@Bind("id") Long id);

        @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
                        "FROM tasks t " +
                        "LEFT JOIN users u ON t.created_by_id = u.id " + // Changed JOIN to LEFT JOIN for creator
                        "LEFT JOIN teams tm ON t.team_id = tm.id " +
                        "WHERE (:teamId IS NULL OR t.team_id = :teamId) " +
                        "AND (:status IS NULL OR t.status = :status) " +
                        "AND (:tag IS NULL OR t.tag = :tag) " +
                        "AND (:creatorId IS NULL OR t.created_by_id = :creatorId) " +
                        "ORDER BY t.id " +
                        "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY")
        List<Task> findWithFilters(
                        @Bind("teamId") Long teamId,
                        @Bind("status") String status,
                        @Bind("tag") String tag,
                        @Bind("creatorId") Long creatorId,
                        @Bind("limit") int limit,
                        @Bind("offset") int offset);

        @SqlQuery("SELECT u.*, t.name as team_name FROM users u " +
                        "JOIN task_assignee ta ON u.id = ta.user_id " +
                        "LEFT JOIN teams t ON u.team_id = t.id " +
                        "WHERE ta.task_id = :taskId")
        List<User> findAssigneesByTaskId(@Bind("taskId") Long taskId);

        // Updated INSERT statement to include estimated_hours and actual_hours
        @SqlUpdate("INSERT INTO tasks (title, description, tag, status, start_date, end_date, created_by_id, team_id, sprint_id, estimated_hours, actual_hours) "
                        +
                        "VALUES (:title, :description, :tag, :status, :startDate, :endDate, :creatorId, :teamId, :sprintId, :estimatedHours, :actualHours)")
        @GetGeneratedKeys("id")
        Long insert(@BindBean Task task);

        // Updated UPDATE statement to include estimated_hours and actual_hours
        @SqlUpdate("UPDATE tasks SET title = :title, description = :description, " +
                        "tag = :tag, status = :status, start_date = :startDate, " +
                        "end_date = :endDate, team_id = :teamId, sprint_id = :sprintId, " +
                        "estimated_hours = :estimatedHours, actual_hours = :actualHours " +
                        "WHERE id = :id")
        int update(@BindBean Task task);

        @SqlUpdate("DELETE FROM tasks WHERE id = :id")
        int delete(@Bind("id") Long id);

        @SqlUpdate("DELETE FROM task_assignee WHERE task_id = :taskId")
        int deleteAllAssignees(@Bind("taskId") Long taskId);

        @SqlUpdate("INSERT INTO task_assignee (task_id, user_id) VALUES (:taskId, :userId)")
        int addAssignee(@Bind("taskId") Long taskId, @Bind("userId") Long userId);

        @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
                        "FROM tasks t " +
                        "LEFT JOIN users u ON t.created_by_id = u.id " + // Changed JOIN to LEFT JOIN for creator
                        "LEFT JOIN teams tm ON t.team_id = tm.id " +
                        "JOIN task_assignee ta ON t.id = ta.task_id " +
                        "WHERE ta.user_id = :userId " +
                        "ORDER BY t.id")
        List<Task> findTasksAssignedToUser(@Bind("userId") Long userId);

        @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
                        "FROM tasks t " +
                        "LEFT JOIN users u ON t.created_by_id = u.id " + // Changed JOIN to LEFT JOIN for creator
                        "LEFT JOIN teams tm ON t.team_id = tm.id " +
                        "WHERE t.team_id = :teamId " +
                        "ORDER BY t.id")
        List<Task> findTasksByTeamId(@Bind("teamId") Long teamId);

        @SqlUpdate("UPDATE tasks SET status = :status WHERE id = :taskId")
        int updateStatus(@Bind("taskId") Long taskId, @Bind("status") String status);

        @SqlUpdate("UPDATE tasks SET actual_hours = :realHours WHERE id = :taskId")
        int updateRealHours(@Bind("taskId") Long taskId, @Bind("realHours") Double realHours);

        @SqlUpdate("UPDATE tasks SET end_date = :endDate WHERE id = :taskId")
        int updateEndDate(@Bind("taskId") Long taskId, @Bind("endDate") String endDate);

        @SqlUpdate("DELETE FROM tasks WHERE id IN (<taskIds>)")
        int deleteMultiple(@BindList("taskIds") List<Long> taskIds);

        @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
                        "FROM tasks t " +
                        "LEFT JOIN users u ON t.created_by_id = u.id " +
                        "LEFT JOIN teams tm ON t.team_id = tm.id " +
                        "WHERE t.id IN (<ids>)")
        @UseRowMapper(TaskMapper.class)
        List<Task> findByIds(@BindList("ids") List<Long> ids);

        @SqlUpdate("UPDATE tasks SET sprint_id = :sprintId WHERE id IN (<taskIds>)")
        int bulkUpdateSprintId(@BindList("taskIds") List<Long> taskIds, @Bind("sprintId") Long sprintId);

        class TaskMapper implements RowMapper<Task> {

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
                        // Correctly maps sprint_id, handling NULLs
                        task.setSprintId(rs.getObject("sprint_id", Long.class));

                        // Add mapping for estimated_hours and actual_hours
                        Double estimatedHours = rs.getObject("estimated_hours", Double.class);
                        task.setEstimatedHours(estimatedHours);

                        Double actualHours = rs.getObject("actual_hours", Double.class);
                        task.setActualHours(actualHours);

                        Long teamId = rs.getObject("team_id", Long.class);
                        if (!rs.wasNull()) {
                                task.setTeamId(teamId);
                        }

                        task.setTeamName(rs.getString("team_name"));

                        return task;
                }
        }
}
