package com.springboot.MyTodoList.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthEndpoint {

    @GetMapping("/healthcheck")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}