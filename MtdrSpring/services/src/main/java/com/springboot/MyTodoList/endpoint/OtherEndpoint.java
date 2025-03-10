package com.springboot.MyTodoList.endpoint;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OtherEndpoint {

    @GetMapping
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of("message", "Task Management API"));
    }

    @GetMapping("/healthcheck")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}