package com.springboot.MyTodoList.config;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import com.springboot.MyTodoList.MyTodoListApplication;
import com.springboot.MyTodoList.controller.BotController;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

        @Bean
        public Jdbi jdbi(DataSource dataSource) {
                TransactionAwareDataSourceProxy dataSourceProxy = new TransactionAwareDataSourceProxy(dataSource);
                Jdbi jdbi = Jdbi.create(dataSourceProxy);

                // (https://jdbi.org/#sql-objects)
                jdbi.installPlugin(new SqlObjectPlugin());

                // Mapeo de las filas para modelos (repository classes)
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.User.class,
                                new com.springboot.MyTodoList.repository.UserRepository.UserMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Task.class,
                                new com.springboot.MyTodoList.repository.TaskRepository.TaskMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Team.class,
                                new com.springboot.MyTodoList.repository.TeamRepository.TeamMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Comment.class,
                                new com.springboot.MyTodoList.repository.CommentRepository.CommentMapper());

		MyTodoListApplication.jdbi = jdbi;

                return jdbi;
        }
}
