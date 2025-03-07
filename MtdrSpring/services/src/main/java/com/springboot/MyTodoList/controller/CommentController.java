// /src/main/java/com/springboot/MyTodoList/controller/CommentController.java
package com.springboot.MyTodoList.controller;

import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.CommentService;
import com.springboot.MyTodoList.service.IdentityService;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private IdentityService identityService;

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            HttpServletRequest request) {

        User currentUser = identityService.getCurrentUser(request);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        // Solo un manager o el creador del comentario deberia eliminar comentarios
        if (!identityService.isManager(request)) {
            // TODO: Revisar si el usuario es el creador del comentario
        }

        commentService.deleteComment(commentId);

        return ResponseEntity.ok(Map.of("message", "Comment deleted"));
    }
}
