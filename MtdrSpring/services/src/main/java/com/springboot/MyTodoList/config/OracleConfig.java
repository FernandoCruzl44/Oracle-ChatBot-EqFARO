package com.springboot.MyTodoList.config;

import oracle.jdbc.pool.OracleDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import io.github.cdimascio.dotenv.Dotenv;

import javax.sql.DataSource;
import java.sql.SQLException;

///*
// This class grabs the appropriate values for OracleDataSource,
// The method that uses env, grabs it from the environment variables set
// in the docker container. The method that uses dbSettings is for local testing
// @author: peter.song@oracle.com
// */
@Configuration
public class OracleConfig {
        Logger logger = LoggerFactory.getLogger("DatabaseLogger");
        @Autowired
        private Environment env;

        @Bean
        public DataSource dataSource() throws SQLException {
                OracleDataSource ds = new OracleDataSource();

				if (!env.containsProperty("driver_class_name")) {
						
						Dotenv dotenv = Dotenv.configure().load();

						dotenv.entries().forEach(entry -> {
										String key = entry.getKey();
										String value = entry.getValue();
										System.setProperty(key, value);
										String maskedValue = key.toLowerCase().contains("token") || key.toLowerCase().contains("password")
												|| key.toLowerCase().contains("secret") ? "********" : value;
								});
				}

                String driver_class = env.getRequiredProperty("driver_class_name");
                logger.info("Using Driver " + driver_class);
                ds.setDriverType(driver_class);

                String db_url = env.getRequiredProperty("db_url");
                logger.info("Using URL: " + db_url);
                ds.setURL(db_url);

                String requiredProperty = env.getRequiredProperty("db_user");
                logger.info("Using Username " + requiredProperty);
                ds.setUser(requiredProperty);

                ds.setPassword(env.getRequiredProperty("dbpassword"));

                return ds;
        }
}
