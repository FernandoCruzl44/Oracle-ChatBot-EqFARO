package com.springboot.MyTodoList.config;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    public Jdbi jdbi(DataSource dataSource) {
        TransactionAwareDataSourceProxy dataSourceProxy = new TransactionAwareDataSourceProxy(dataSource);
        Jdbi jdbi = Jdbi.create(dataSourceProxy);

        // Add SQL Object Plugin to support repositories
        jdbi.installPlugin(new SqlObjectPlugin());

        // Register row mappers for our models
        jdbi.registerRowMapper(com.springboot.MyTodoList.model.User.class,
                new com.springboot.MyTodoList.repository.mapper.UserMapper());
        jdbi.registerRowMapper(com.springboot.MyTodoList.model.Task.class,
                new com.springboot.MyTodoList.repository.mapper.TaskMapper());
        jdbi.registerRowMapper(com.springboot.MyTodoList.model.Team.class,
                new com.springboot.MyTodoList.repository.mapper.TeamMapper());
        jdbi.registerRowMapper(com.springboot.MyTodoList.model.Comment.class,
                new com.springboot.MyTodoList.repository.mapper.CommentMapper());

        return jdbi;
    }
}