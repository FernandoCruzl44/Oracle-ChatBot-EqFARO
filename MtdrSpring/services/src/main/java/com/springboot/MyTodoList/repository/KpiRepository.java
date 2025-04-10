package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import com.springboot.MyTodoList.model.Kpi;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

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
            "    t.STATUS = 'Completada' " +
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
            "    t.STATUS = 'Completada' " +
            "    AND u.TEAM_ID = :teamId " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    COMPLETED_TASKS DESC")
    List<Kpi> getCompletedTasksByMemberAndTeam(@Bind("teamId") Long teamId);

    // KPI 2: Horas actuales por miembro
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    t.ACTUAL_HOURS IS NOT NULL " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    TOTAL_ACTUAL_HOURS DESC")
    List<Kpi> getTotalActualHoursByMember();

    // KPI 2 filtrado por equipo
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    SUM(t.ACTUAL_HOURS) AS TOTAL_ACTUAL_HOURS " +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "WHERE " +
            "    t.ACTUAL_HOURS IS NOT NULL " +
            "    AND u.TEAM_ID = :teamId " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    TOTAL_ACTUAL_HOURS DESC")
    List<Kpi> getTotalActualHoursByMemberAndTeam(@Bind("teamId") Long teamId);

    // KPI 3: Tasa de finalización por miembro
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, " +
            "    COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, " +
            "    ROUND(COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) / COUNT(t.ID) * 100, 2) AS COMPLETION_RATE_PERCENT "
            +
            "FROM " +
            "    TODOUSER.USERS u " +
            "JOIN " +
            "    TODOUSER.TASK_ASSIGNEE ta ON u.ID = ta.USER_ID " +
            "JOIN " +
            "    TODOUSER.TASKS t ON ta.TASK_ID = t.ID " +
            "GROUP BY " +
            "    u.NAME " +
            "ORDER BY " +
            "    COMPLETION_RATE_PERCENT DESC")
    List<Kpi> getCompletionRateByMember();

    // KPI 3 filtrado por equipo
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, " +
            "    COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, " +
            "    ROUND(COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) / COUNT(t.ID) * 100, 2) AS COMPLETION_RATE_PERCENT "
            +
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
            "    COMPLETION_RATE_PERCENT DESC")
    List<Kpi> getCompletionRateByMemberAndTeam(@Bind("teamId") Long teamId);

    // KPI adicional: Filtrar por sprint
    @SqlQuery("SELECT " +
            "    u.NAME AS MEMBER_NAME, " +
            "    COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) AS COMPLETED_TASKS, " +
            "    COUNT(t.ID) AS TOTAL_ASSIGNED_TASKS, " +
            "    ROUND(COUNT(CASE WHEN t.STATUS IN ('Completada', 'DONE') THEN 1 END) / COUNT(t.ID) * 100, 2) AS COMPLETION_RATE_PERCENT "
            +
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
            "    COMPLETION_RATE_PERCENT DESC")
    List<Kpi> getCompletionRateByMemberAndSprint(@Bind("sprintId") Long sprintId);

    // RowMapper para mapear los resultados de las consultas a objetos Kpi
    class KpiMapper implements RowMapper<Kpi> {
        @Override
        public Kpi map(ResultSet rs, StatementContext ctx) throws SQLException {
            Kpi kpi = new Kpi();
            kpi.setMemberName(rs.getString("MEMBER_NAME"));

            // Manejar los diferentes resultados de columnas dependiendo de la consulta
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
            } catch (SQLException e) {
                // Si la columna no existe, ignorar
            }

            return kpi;
        }
    }
}