package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.IdentityUtil;

import javax.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    public CommentController(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    @DeleteMapping("/{commentId}")
    @Transactional
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            CommentRepository commentRepo = handle.attach(CommentRepository.class);

            Optional<Comment> commentOpt = commentRepo.findById(commentId);
            if (!commentOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Comment comment = commentOpt.get();

            User currentUser = handle.attach(UserRepository.class)
                    .findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean isCreator = comment.getCreatorId().equals(currentUserId);

            if (!isManager && !isCreator) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }

            commentRepo.delete(commentId);

            return ResponseEntity.ok(Map.of("message", "Comment deleted"));
        });
    }

    @PostMapping("/task/{taskId}")
    @Transactional
    public ResponseEntity<?> createComment(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        String content = request.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Content is required"));
        }

        return jdbi.inTransaction(handle -> {
            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            Optional<Task> taskOpt = taskRepo.findById(taskId);

            if (!taskOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Comment comment = new Comment();
            comment.setTaskId(taskId);
            comment.setContent(content);
            comment.setCreatorId(currentUserId);

            Long commentId = handle
                    .attach(CommentRepository.class)
                    .insert(comment);

            List<Comment> comments = handle
                    .attach(CommentRepository.class)
                    .findByTaskId(taskId);

            Comment createdComment = comments
                    .stream()
                    .filter(c -> c.getId().equals(commentId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Comment not found after creation"));

            return ResponseEntity.ok(createdComment);
        });
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<?> getComments(
            @PathVariable Long taskId,
            HttpServletRequest request) {
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            Optional<Task> taskOpt = taskRepo.findById(taskId);

            if (!taskOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();
            User currentUser = handle
                    .attach(UserRepository.class)
                    .findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean isTeamMember = currentUser.getTeamId() != null &&
                    task.getTeamId() != null &&
                    currentUser.getTeamId().equals(task.getTeamId());

            if (!isManager && !isTeamMember) {
                List<User> assignees = taskRepo.findAssigneesByTaskId(taskId);
                boolean isAssigned = assignees
                        .stream()
                        .anyMatch(user -> user.getId().equals(currentUserId));

                if (!isAssigned) {
                    return ResponseEntity.status(403).body(
                            Map.of("message", "Forbidden"));
                }
            }

            List<Comment> comments = handle
                    .attach(CommentRepository.class)
                    .findByTaskId(taskId);

            return ResponseEntity.ok(comments);
        });
    }
}