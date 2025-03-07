package com.springboot.MyTodoList.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OtherController {

    @GetMapping
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of("message", "Task Management API"));
    }

    @GetMapping("/debug")
    public ResponseEntity<?> debug() {
        return ResponseEntity.ok(Map.of("message", "Ok buddy dev"));
    }

    @GetMapping("/healthcheck")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
