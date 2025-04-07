package com.springboot.MyTodoList.config;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {
        private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

        @Bean
        public Jdbi jdbi(DataSource dataSource) {
                logger.info("Initializing Jdbi with transaction-aware DataSource");
                TransactionAwareDataSourceProxy dataSourceProxy = new TransactionAwareDataSourceProxy(dataSource);
                Jdbi jdbi = Jdbi.create(dataSourceProxy);

                jdbi.installPlugin(new SqlObjectPlugin());

                jdbi.registerRowMapper(com.springboot.MyTodoList.model.User.class,
                                new com.springboot.MyTodoList.repository.UserRepository.UserMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Task.class,
                                new com.springboot.MyTodoList.repository.TaskRepository.TaskMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Team.class,
                                new com.springboot.MyTodoList.repository.TeamRepository.TeamMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Comment.class,
                                new com.springboot.MyTodoList.repository.CommentRepository.CommentMapper());
                jdbi.registerRowMapper(com.springboot.MyTodoList.model.Sprint.class,
                                new com.springboot.MyTodoList.repository.SprintRepository.SprintMapper());

                logger.info("Jdbi initialized with all repository mappers");
                return jdbi;
        }
}