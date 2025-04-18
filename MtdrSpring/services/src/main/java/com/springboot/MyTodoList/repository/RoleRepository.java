package com.springboot.MyTodoList.repository;

import org.jdbi.v3.sqlobject.statement.SqlQuery;

import java.util.List;

public interface RoleRepository {

    @SqlQuery("SELECT DISTINCT team_role FROM users WHERE team_role IS NOT NULL ORDER BY team_role")
    List<String> findAllTeamRoles();
}