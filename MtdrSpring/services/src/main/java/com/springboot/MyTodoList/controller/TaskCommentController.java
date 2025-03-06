package com.springboot.MyTodoList.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.TaskComment;
import com.springboot.MyTodoList.service.TaskCommentService;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class TaskCommentController {

    @Autowired
    private TaskCommentService taskCommentService;

    @PostMapping
    public TaskComment createComment(@RequestBody TaskComment comment) {
        return taskCommentService.createComment(comment);
    }

    @GetMapping("/task/{taskID}")
    public List<TaskComment> getCommentsByTask(@PathVariable Long taskID) {
        return taskCommentService.getCommentsByTask(taskID);
    }

    @GetMapping("/user/{userID}")
    public List<TaskComment> getCommentsByUser(@PathVariable Long userID) {
        return taskCommentService.getCommentsByUser(userID);
    }
}

