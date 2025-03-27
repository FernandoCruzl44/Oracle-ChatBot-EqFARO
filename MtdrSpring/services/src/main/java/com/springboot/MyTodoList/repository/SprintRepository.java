package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper; // Import this

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.Task;
// Import TaskMapper from TaskRepository
import com.springboot.MyTodoList.repository.TaskRepository.TaskMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

// Register the TaskMapper for methods returning Task or List<Task>
@RegisterRowMapper(TaskMapper.class)
public interface SprintRepository {

    @SqlQuery("SELECT s.*, t.name as team_name, " +
            "(SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id) as tasks_count, " +
            "(SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status IN ('Completada', 'DONE')) as completed_tasks_count "
            +
            "FROM sprints s " +
            "JOIN teams t ON s.team_id = t.id " +
            "ORDER BY s.start_date DESC")
    List<Sprint> findAll();

    @SqlQuery("SELECT s.*, t.name as team_name, " +
            "(SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id) as tasks_count, " +
            "(SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status IN ('Completada', 'DONE')) as completed_tasks_count "
            +
            "FROM sprints s " +
            "JOIN teams t ON s.team_id = t.id " +
            "WHERE s.team_id = :teamId " +
            "ORDER BY s.start_date DESC")
    List<Sprint> findByTeamId(@Bind("teamId") Long teamId);

    @SqlQuery("SELECT s.*, t.name as team_name, " +
            "(SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id) as tasks_count, " +
            "(SELECT COUNT(*) FROM tasks WHERE sprint_id = s.id AND status IN ('Completada', 'DONE')) as completed_tasks_count "
            +
            "FROM sprints s " +
            "JOIN teams t ON s.team_id = t.id " +
            "WHERE s.id = :id")
    Optional<Sprint> findById(@Bind("id") Long id);

    // Updated query to include joins and aliases needed by TaskMapper
    @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
            "FROM tasks t " +
            "LEFT JOIN users u ON t.created_by_id = u.id " +
            "LEFT JOIN teams tm ON t.team_id = tm.id " +
            "WHERE t.sprint_id = :sprintId " +
            "ORDER BY t.priority DESC, t.start_date ASC") // Use alias t. for clarity
    List<Task> findTasksBySprint(@Bind("sprintId") Long sprintId);

    // Updated query to include joins and aliases needed by TaskMapper
    @SqlQuery("SELECT t.*, u.name as creator_name, tm.name as team_name " +
            "FROM tasks t " +
            "LEFT JOIN users u ON t.created_by_id = u.id " +
            "LEFT JOIN teams tm ON t.team_id = tm.id " +
            "WHERE t.sprint_id = :sprintId AND t.status NOT IN ('Completada', 'DONE', 'Cancelada') " +
            "ORDER BY t.priority DESC, t.start_date ASC") // Use alias t. for clarity
    List<Task> findIncompleteTasksBySprint(@Bind("sprintId") Long sprintId);

    @SqlUpdate("INSERT INTO sprints (team_id, name, status, start_date, end_date) " +
            "VALUES (:teamId, :name, :status, :startDate, :endDate)")
    @GetGeneratedKeys("id")
    Long insert(@BindBean Sprint sprint);

    @SqlUpdate("UPDATE sprints SET name = :name, status = :status, start_date = :startDate, end_date = :endDate WHERE id = :id")
    int update(@BindBean Sprint sprint);

    @SqlUpdate("DELETE FROM sprints WHERE id = :id")
    int delete(@Bind("id") Long id);

    @SqlUpdate("UPDATE tasks SET sprint_id = :sprintId WHERE id = :taskId")
    int assignTaskToSprint(@Bind("taskId") Long taskId, @Bind("sprintId") Long sprintId);

    @SqlUpdate("UPDATE tasks SET sprint_id = NULL WHERE id = :taskId")
    int removeTaskFromSprint(@Bind("taskId") Long taskId);

    @SqlUpdate("UPDATE tasks SET sprint_id = :newSprintId WHERE sprint_id = :sprintId AND status NOT IN ('Completada', 'DONE', 'Cancelada')")
    int moveIncompleteTasksToNewSprint(@Bind("sprintId") Long sprintId, @Bind("newSprintId") Long newSprintId);

    @SqlUpdate("UPDATE tasks SET sprint_id = NULL WHERE sprint_id = :sprintId AND status NOT IN ('Completada', 'DONE', 'Cancelada')")
    int moveIncompleteTasksToBacklog(@Bind("sprintId") Long sprintId);

    @SqlUpdate("UPDATE sprints SET status = :status WHERE id = :id")
    int updateSprintStatus(@Bind("id") Long id, @Bind("status") String status);

    // SprintMapper remains the same
    class SprintMapper implements RowMapper<Sprint> {
        @Override
        public Sprint map(ResultSet rs, StatementContext ctx) throws SQLException {
            Sprint sprint = new Sprint();
            sprint.setId(rs.getLong("id"));
            sprint.setTeamId(rs.getLong("team_id"));
            sprint.setTeamName(rs.getString("team_name"));
            sprint.setName(rs.getString("name"));
            sprint.setStatus(rs.getString("status"));
            sprint.setStartDate(rs.getDate("start_date"));
            sprint.setEndDate(rs.getDate("end_date"));

            // Handle the computed fields which might not be present in all queries
            try {
                sprint.setTasksCount(rs.getInt("tasks_count"));
                sprint.setCompletedTasksCount(rs.getInt("completed_tasks_count"));
            } catch (SQLException e) {
                // Ignore if columns don't exist
                sprint.setTasksCount(0);
                sprint.setCompletedTasksCount(0);
            }

            return sprint;
        }
    }
}
