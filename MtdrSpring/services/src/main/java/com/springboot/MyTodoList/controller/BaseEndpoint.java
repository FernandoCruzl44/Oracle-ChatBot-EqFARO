package com.springboot.MyTodoList.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BaseEndpoint {

    @GetMapping
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of("message", "Faro API"));
    }
}