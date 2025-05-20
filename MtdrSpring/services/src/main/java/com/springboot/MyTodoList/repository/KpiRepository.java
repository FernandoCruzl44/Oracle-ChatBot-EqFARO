package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;

import com.springboot.MyTodoList.model.Kpi;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@RegisterBeanMapper(Kpi.class)
public interface KpiRepository {

    // KPI 1: Tareas completadas por miembro
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(t.ID) AS COMPLETED_TASKS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    t.STATUS IN ('Completada', 'DONE') " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    COMPLETED_TASKS DESC")
    List<Kpi> getCompletedTasksByMember();

    // KPI 1 filtrado por equipo
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(t.ID) AS COMPLETED_TASKS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    t.STATUS IN ('Completada', 'DONE') " +
            "    AND u.TEAM_ID = :teamId " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    COMPLETED_TASKS DESC")
    List<Kpi> getCompletedTasksByMemberAndTeam(@Bind("teamId") Long teamId);

    // KPI 2: Horas actuales por miembro
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, " +
            "    SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    t.ACTUAL_HOURS IS NOT NULL OR t.ESTIMATED_HOURS IS NOT NULL " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    MEMBER_NAME")
    List<Kpi> getTotalActualHoursByMember();

    // KPI 2 filtrado por equipo
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, " +
            "    SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    (t.ACTUAL_HOURS IS NOT NULL OR t.ESTIMATED_HOURS IS NOT NULL) " +
            "    AND u.TEAM_ID = :teamId " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    MEMBER_NAME")
    List<Kpi> getTotalActualHoursByMemberAndTeam(@Bind("teamId") Long teamId);

    // KPI 3: Tasa de finalización por miembro
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, " +
            "    COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, " +
            "    ROUND(CASE WHEN COUNT(t.ID) = 0 THEN 0 ELSE COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) * 100.0 / COUNT(t.ID) END, 2) AS COMPLETION_RATE_PERCENT, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, " +
            "    SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    MEMBER_NAME")
    List<Kpi> getCompletionRateByMember();

    // KPI 3 filtrado por equipo
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, " +
            "    COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, " +
            "    ROUND(CASE WHEN COUNT(t.ID) = 0 THEN 0 ELSE COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) * 100.0 / COUNT(t.ID) END, 2) AS COMPLETION_RATE_PERCENT, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, " +
            "    SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    u.TEAM_ID = :teamId " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    MEMBER_NAME")
    List<Kpi> getCompletionRateByMemberAndTeam(@Bind("teamId") Long teamId);

    // KPI adicional: Filtrar por sprint
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, " +
            "    COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, " +
            "    ROUND(CASE WHEN COUNT(t.ID) = 0 THEN 0 ELSE COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) * 100.0 / COUNT(t.ID) END, 2) AS COMPLETION_RATE_PERCENT, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, " +
            "    SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    t.SPRINT_ID = :sprintId " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    MEMBER_NAME")
    List<Kpi> getCompletionRateByMemberAndSprint(@Bind("sprintId") Long sprintId);

    // KPI 1: Completed tasks per sprint
    @SqlQuery(
        "SELECT \n" +
        "  s.NAME AS MEMBER_NAME, \n" +
        "  COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS \n" +
        "FROM TODOUSER.SPRINTS s \n" +
        "LEFT JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID \n" +
        "GROUP BY s.NAME, s.START_DATE \n" +
        "ORDER BY s.START_DATE"
    )
    List<Kpi> getCompletedTasksBySprint();

    // KPI 1 filtered by team
    @SqlQuery(
        "SELECT \n" +
        "  s.NAME AS MEMBER_NAME, \n" +
        "  COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS \n" +
        "FROM TODOUSER.SPRINTS s \n" +
        "LEFT JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID \n" +
        "WHERE s.TEAM_ID = :teamId \n" +
        "GROUP BY s.NAME, s.START_DATE \n" +
        "ORDER BY s.START_DATE"
    )
    List<Kpi> getCompletedTasksBySprintAndTeam(@Bind("teamId") Long teamId);

    // KPI 2: Total actual & estimated hours per sprint
    @SqlQuery(
        "SELECT \n" +
        "  s.NAME AS MEMBER_NAME, \n" +
        "  SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, \n" +
        "  SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS \n" +
        "FROM TODOUSER.SPRINTS s \n" +
        "LEFT JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID \n" +
        "GROUP BY s.NAME, s.START_DATE \n" +
        "ORDER BY s.START_DATE"
    )
    List<Kpi> getTotalActualHoursBySprint();

    // KPI 2 filtered by team
    @SqlQuery(
        "SELECT \n" +
        "  s.NAME AS MEMBER_NAME, \n" +
        "  SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, \n" +
        "  SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS \n" +
        "FROM TODOUSER.SPRINTS s \n" +
        "LEFT JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID \n" +
        "WHERE s.TEAM_ID = :teamId \n" +
        "GROUP BY s.NAME, s.START_DATE \n" +
        "ORDER BY s.START_DATE"
    )
    List<Kpi> getTotalActualHoursBySprintAndTeam(@Bind("teamId") Long teamId);

    // KPI 3: Completion rate & detailed metrics per sprint
    @SqlQuery(
        "SELECT \n" +
        "  s.NAME AS MEMBER_NAME, \n" +
        "  COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, \n" +
        "  COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, \n" +
        "  ROUND(\n" +
        "    CASE WHEN COUNT(t.ID) = 0 THEN 0 \n" +
        "         ELSE COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) * 100.0 / COUNT(t.ID) \n" +
        "    END, 2\n" +
        "  ) AS COMPLETION_RATE_PERCENT, \n" +
        "  SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, \n" +
        "  SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS \n" +
        "FROM TODOUSER.SPRINTS s \n" +
        "LEFT JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID \n" +
        "GROUP BY s.NAME, s.START_DATE \n" +
        "ORDER BY s.START_DATE"
    )
    List<Kpi> getCompletionRateBySprint();

    // KPI 3 filtered by team
    @SqlQuery(
        "SELECT \n" +
        "  s.NAME AS MEMBER_NAME, \n" +
        "  COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, \n" +
        "  COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, \n" +
        "  ROUND(\n" +
        "    CASE WHEN COUNT(t.ID) = 0 THEN 0 \n" +
        "         ELSE COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) * 100.0 / COUNT(t.ID) \n" +
        "    END, 2\n" +
        "  ) AS COMPLETION_RATE_PERCENT, \n" +
        "  SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS, \n" +
        "  SUM(t.ESTIMATED_HOURS) AS TOTAL_ESTIMATED_HOURS \n" +
        "FROM TODOUSER.SPRINTS s \n" +
        "LEFT JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID \n" +
        "WHERE s.TEAM_ID = :teamId \n" +
        "GROUP BY s.NAME, s.START_DATE \n" +
        "ORDER BY s.START_DATE"
    )
    List<Kpi> getCompletionRateBySprintAndTeam(@Bind("teamId") Long teamId);

    // Sprint Performance - Hours worked per sprint and member
    @SqlQuery("SELECT " +
            "    s.NAME AS SPRINT_NAME, " +
            "    u.NAME AS MEMBER_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS " +
            "FROM TODOUSER.SPRINTS s " +
            "JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.USERS u ON u.ID = ta.USER_ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "GROUP BY s.NAME, u.NAME, s.START_DATE " +
            "ORDER BY s.START_DATE, u.NAME")
    List<Kpi> getHoursPerSprintAndMemberAllTeams();

    @SqlQuery("SELECT " +
            "    s.NAME AS SPRINT_NAME, " +
            "    u.NAME AS MEMBER_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS " +
            "FROM TODOUSER.SPRINTS s " +
            "JOIN TODOUSER.TASKS t ON t.SPRINT_ID = s.ID " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.USERS u ON u.ID = ta.USER_ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "AND u.TEAM_ID = :teamId " +
            "GROUP BY s.NAME, u.NAME, s.START_DATE " +
            "ORDER BY s.START_DATE, u.NAME")
    List<Kpi> getHoursPerSprintAndMember(@Bind("teamId") Long teamId);

    // Developer Performance - Hours per sprint per developer
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    s.NAME AS SPRINT_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS " +
            "FROM TODOUSER.USERS u " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.SPRINTS s ON t.SPRINT_ID = s.ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "GROUP BY u.NAME, s.NAME, s.START_DATE " +
            "ORDER BY u.NAME, s.START_DATE")
    List<Kpi> getDeveloperHoursPerSprintAllTeams();

    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    s.NAME AS SPRINT_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS " +
            "FROM TODOUSER.USERS u " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.SPRINTS s ON t.SPRINT_ID = s.ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "AND u.TEAM_ID = :teamId " +
            "GROUP BY u.NAME, s.NAME, s.START_DATE " +
            "ORDER BY u.NAME, s.START_DATE")
    List<Kpi> getDeveloperHoursPerSprint(@Bind("teamId") Long teamId);

    // Developer Performance - Tasks per sprint per developer
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    s.NAME AS SPRINT_NAME, " +
            "    COUNT(t.ID) AS COMPLETED_TASKS " +
            "FROM TODOUSER.USERS u " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.SPRINTS s ON t.SPRINT_ID = s.ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "GROUP BY u.NAME, s.NAME, s.START_DATE " +
            "ORDER BY u.NAME, s.START_DATE")
    List<Kpi> getDeveloperTasksPerSprintAllTeams();

    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    s.NAME AS SPRINT_NAME, " +
            "    COUNT(t.ID) AS COMPLETED_TASKS " +
            "FROM TODOUSER.USERS u " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.SPRINTS s ON t.SPRINT_ID = s.ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "AND u.TEAM_ID = :teamId " +
            "GROUP BY u.NAME, s.NAME, s.START_DATE " +
            "ORDER BY u.NAME, s.START_DATE")
    List<Kpi> getDeveloperTasksPerSprint(@Bind("teamId") Long teamId);

    // Last Sprint Report - Tasks by developer
    @SqlQuery("WITH LastSprint AS ( " +
            "    SELECT ID, NAME " +
            "    FROM TODOUSER.SPRINTS " +
            "    WHERE STATUS = 'COMPLETED' " +
            "    ORDER BY END_DATE DESC " +
            "    FETCH FIRST 1 ROW ONLY " +
            ") " +
            "SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    t.TITLE AS TASK_TITLE, " +
            "    t.DESCRIPTION AS TASK_DESCRIPTION, " +
            "    t.ACTUAL_HOURS AS TOTAL_ACTUAL_HOURS, " +
            "    t.ESTIMATED_HOURS AS TOTAL_ESTIMATED_HOURS, " +
            "    t.STATUS AS TASK_STATUS " +
            "FROM LastSprint ls " +
            "JOIN TODOUSER.TASKS t ON t.SPRINT_ID = ls.ID " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.USERS u ON u.ID = ta.USER_ID " +
            "WHERE t.STATUS IN ('Completada', 'DONE') " +
            "AND (:teamId IS NULL OR u.TEAM_ID = :teamId) " +
            "ORDER BY u.NAME, t.TITLE")
    List<Kpi> getLastSprintTasksByDeveloper(@Bind("teamId") Long teamId);

    // Specific Sprint Tasks - Get tasks for a specific sprint
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    t.TITLE AS TASK_TITLE, " +
            "    t.DESCRIPTION AS TASK_DESCRIPTION, " +
            "    t.ACTUAL_HOURS AS TOTAL_ACTUAL_HOURS, " +
            "    t.ESTIMATED_HOURS AS TOTAL_ESTIMATED_HOURS, " +
            "    t.STATUS AS TASK_STATUS, " +
            "    t.SPRINT_ID AS SPRINT_ID " +
            "FROM TODOUSER.TASKS t " +
            "JOIN TODOUSER.TASK_ASSIGNEE ta ON ta.TASK_ID = t.ID " +
            "JOIN TODOUSER.USERS u ON u.ID = ta.USER_ID " +
            "WHERE t.SPRINT_ID = :sprintId " +
            "AND t.STATUS IN ('Completada', 'DONE') " +
            "AND (:teamId IS NULL OR u.TEAM_ID = :teamId) " +
            "ORDER BY u.NAME, t.TITLE")
    List<Kpi> getSprintTasksByDeveloper(@Bind("sprintId") Long sprintId, @Bind("teamId") Long teamId);

    // RowMapper para mapear los resultados de las consultas a objetos Kpi
    class KpiMapper implements RowMapper<Kpi> {
        @Override
        public Kpi map(ResultSet rs, StatementContext ctx) throws SQLException {
            Kpi kpi = new Kpi();
            kpi.setMemberName(rs.getString("MEMBER_NAME"));

            // Manejar los diferentes resultados de columnas dependiendo de la consulta
            try {
                kpi.setSprintName(rs.getString("SPRINT_NAME"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setTaskTitle(rs.getString("TASK_TITLE"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setTaskDescription(rs.getString("TASK_DESCRIPTION"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setTaskStatus(rs.getString("TASK_STATUS"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setCompletedTasks(rs.getInt("COMPLETED_TASKS"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setTotalAssignedTasks(rs.getInt("TOTAL_ASSIGNED_TASKS"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setCompletionRatePercent(rs.getBigDecimal("COMPLETION_RATE_PERCENT"));
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setTotalActualHours(rs.getDouble("TOTAL_ACTUAL_HOURS"));
                if (rs.wasNull()) {
                    kpi.setTotalActualHours(null);
                }
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            try {
                kpi.setTotalEstimatedHours(rs.getDouble("TOTAL_ESTIMATED_HOURS"));
                if (rs.wasNull()) {
                    kpi.setTotalEstimatedHours(null);
                }
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            return kpi;
        }
    }
}
