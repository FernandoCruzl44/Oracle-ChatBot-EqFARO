package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.IdentityUtil;
import com.springboot.MyTodoList.model.Comment;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.CommentRepository;
import com.springboot.MyTodoList.repository.UserRepository;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/comments")
public class CommentEndpoint {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    public CommentEndpoint(Jdbi jdbi, IdentityUtil identityUtil) {
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
}