// /src/main/java/com/springboot/MyTodoList/security/WebSecurityConfiguration.java
package com.springboot.MyTodoList.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity
public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .authorizeRequests()
                .antMatchers("/api/identity/**").permitAll()
                .antMatchers("/api/debug", "/api/healthcheck", "/api").permitAll()
                .antMatchers("/api/**").permitAll()
                .and().cors();
    }
}