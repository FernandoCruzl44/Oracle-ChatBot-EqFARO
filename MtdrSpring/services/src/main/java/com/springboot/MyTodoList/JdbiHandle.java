package com.springboot.MyTodoList;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a field to be automatically injected with a Jdbi repository.
 * When applied to a field in a Spring-managed bean, the field will be
 * populated with an on-demand instance of the repository interface.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.FIELD })
public @interface JdbiHandle {
}