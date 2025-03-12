package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.IdentityUtil;
import com.springboot.MyTodoList.MyTodoListApplication;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import java.util.*;
import javax.servlet.http.HttpServletRequest;
import org.jdbi.v3.core.Jdbi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    public TaskController(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    private static final Logger logger = LoggerFactory.getLogger(
            MyTodoListApplication.class);

    @GetMapping
    public ResponseEntity<?> getTasks(
            @RequestParam(required = false) String view_mode,
            @RequestParam(required = false) Long team_id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long created_by,
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            User currentUser = handle
                    .attach(UserRepository.class)
                    .findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            TaskRepository taskRepo = handle.attach(TaskRepository.class);

            if (!isManager &&
                    team_id != null &&
                    (currentUser.getTeamId() == null ||
                            !currentUser.getTeamId().equals(team_id))) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "Forbidden"));
            }

            List<Task> tasks;

            // Managers con view_mode=assigned
            if ("assigned".equals(view_mode)) {
                if (isManager && (team_id == null || team_id == 0)) {
                    // view_mode=assigned y no un equipo especifico
                    // retorna todas las tareas, de todos los equipos
                    tasks = taskRepo.findWithFilters(
                            null,
                            status,
                            tag,
                            created_by,
                            limit,
                            skip);
                } else {
                    // Caso regular - solo tareas asignadas al usuario actual
                    tasks = taskRepo.findTasksAssignedToUser(currentUserId);
                }
            } else if ("team".equals(view_mode)) {
                if (isManager && team_id == null) {
                    // Para managers con "view_mode=team" y sin team_id,
                    // retorna TODAS las tareas de todos los equipos
                    tasks = taskRepo.findWithFilters(
                            null,
                            status,
                            tag,
                            created_by,
                            limit,
                            skip);
                } else {
                    // Tareas específicas del equipo
                    Long effectiveTeamId = team_id;
                    if (team_id == null && currentUser.getTeamId() != null) {
                        effectiveTeamId = currentUser.getTeamId();
                    }

                    if (effectiveTeamId != null) {
                        tasks = taskRepo.findTasksByTeamId(effectiveTeamId);
                    } else {
                        tasks = new ArrayList<>();
                    }
                }
            } else {
                // Filtros generales
                tasks = taskRepo.findWithFilters(
                        team_id,
                        status,
                        tag,
                        created_by,
                        limit,
                        skip);
            }

            // Obtiene los asignados para cada tarea
            for (Task task : tasks) {
                List<User> assignees = taskRepo.findAssigneesByTaskId(
                        task.getId());
                task.setAssignees(assignees);
            }

            logger.debug("Returning tasks: {}", tasks);
            return ResponseEntity.ok(tasks);
        });
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTask(
            @PathVariable Long taskId,
            HttpServletRequest request) {
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            Optional<Task> taskOpt = handle
                    .attach(TaskRepository.class)
                    .findById(taskId);

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
                // Revisa si el usuario está asignado a la tarea
                List<User> assignees = handle
                        .attach(TaskRepository.class)
                        .findAssigneesByTaskId(task.getId());
                boolean isAssigned = assignees
                        .stream()
                        .anyMatch(user -> user.getId().equals(currentUserId));

                if (!isAssigned) {
                    return ResponseEntity.status(403).body(
                            Map.of("message", "Forbidden"));
                }
            }

            // Obtiene los asignados para la tarea
            List<User> assignees = handle
                    .attach(TaskRepository.class)
                    .findAssigneesByTaskId(task.getId());
            task.setAssignees(assignees);

            return ResponseEntity.ok(task);
        });
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createTask(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            // Crea la tarea
            Task task = new Task();
            task.setTitle((String) request.get("title"));
            task.setDescription((String) request.get("description"));
            task.setTag((String) request.get("tag"));
            task.setStatus((String) request.get("status"));
            task.setStartDate((String) request.get("startDate"));
            task.setEndDate((String) request.get("endDate"));
            task.setCreatorId(currentUserId);

            if (request.containsKey("team_id") && request.get("team_id") != null) {
                task.setTeamId(Long.valueOf(request.get("team_id").toString()));
            }

            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            Long taskId = taskRepo.insert(task);

            // Se agregan los asignados si se proporcionan
            if (request.containsKey("assignee_ids") &&
                    request.get("assignee_ids") != null) {
                @SuppressWarnings("unchecked")
                List<Object> rawIds = (List<Object>) request.get(
                        "assignee_ids");

                for (Object rawId : rawIds) {
                    Long userId = Long.valueOf(rawId.toString());
                    taskRepo.addAssignee(taskId, userId);
                }
            }

            // Fetch la tarea completa con los asignados
            Optional<Task> createdTask = taskRepo.findById(taskId);
            if (createdTask.isPresent()) {
                Task fullTask = createdTask.get();
                fullTask.setAssignees(taskRepo.findAssigneesByTaskId(taskId));
                return ResponseEntity.ok(fullTask);
            } else {
                return ResponseEntity.status(500).body(
                        Map.of("message", "Error retrieving created task"));
            }
        });
    }

    @PutMapping("/{taskId}")
    @Transactional
    public ResponseEntity<?> updateTask(
            @PathVariable Long taskId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
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
                return ResponseEntity.status(403).body(
                        Map.of("message", "Forbidden"));
            }

            if (request.containsKey("title")) {
                task.setTitle((String) request.get("title"));
            }

            if (request.containsKey("description")) {
                task.setDescription((String) request.get("description"));
            }

            if (request.containsKey("tag")) {
                task.setTag((String) request.get("tag"));
            }

            if (request.containsKey("status")) {
                task.setStatus((String) request.get("status"));
            }

            if (request.containsKey("startDate")) {
                task.setStartDate((String) request.get("startDate"));
            }

            if (request.containsKey("endDate")) {
                task.setEndDate((String) request.get("endDate"));
            }

            if (request.containsKey("team_id")) {
                Object teamIdObj = request.get("team_id");
                if (teamIdObj != null) {
                    task.setTeamId(Long.valueOf(teamIdObj.toString()));
                } else {
                    task.setTeamId(null);
                }
            }

            taskRepo.update(task);

            if (request.containsKey("assignee_ids")) {
                taskRepo.deleteAllAssignees(taskId);

                @SuppressWarnings("unchecked")
                List<Object> rawIds = (List<Object>) request.get(
                        "assignee_ids");

                if (rawIds != null) {
                    for (Object rawId : rawIds) {
                        Long userId = Long.valueOf(rawId.toString());
                        taskRepo.addAssignee(taskId, userId);
                    }
                }
            }

            Optional<Task> updatedTaskOpt = taskRepo.findById(taskId);
            if (updatedTaskOpt.isPresent()) {
                Task updatedTask = updatedTaskOpt.get();
                updatedTask.setAssignees(
                        taskRepo.findAssigneesByTaskId(taskId));
                return ResponseEntity.ok(updatedTask);
            } else {
                return ResponseEntity.status(500).body(
                        Map.of("message", "Error retrieving updated task"));
            }
        });
    }

    @DeleteMapping("/{taskId}")
    @Transactional
    public ResponseEntity<?> deleteTask(
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

            taskRepo.delete(taskId);

            return ResponseEntity.ok(Map.of("message", "Task deleted"));
        });
    }

    @PutMapping("/{taskId}/status")
    @Transactional
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        String status = request.get("status");
        if (status == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Status is required"));
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

            taskRepo.updateStatus(taskId, status);

            Optional<Task> updatedTaskOpt = taskRepo.findById(taskId);
            if (updatedTaskOpt.isPresent()) {
                Task updatedTask = updatedTaskOpt.get();
                updatedTask.setAssignees(
                        taskRepo.findAssigneesByTaskId(taskId));
                return ResponseEntity.ok(updatedTask);
            } else {
                return ResponseEntity.status(500).body(
                        Map.of("message", "Error retrieving updated task"));
            }
        });
    }

    @PutMapping("/{taskId}/assign")
    @Transactional
    public ResponseEntity<?> assignTask(
            @PathVariable Long taskId,
            @RequestBody Map<String, List<Object>> request,
            HttpServletRequest httpRequest) {
        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        List<Object> assigneeIdsRaw = request.get("assignee_ids");
        if (assigneeIdsRaw == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "assignee_ids is required"));
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
                return ResponseEntity.status(403).body(
                        Map.of("message", "Forbidden"));
            }

            taskRepo.deleteAllAssignees(taskId);

            for (Object rawId : assigneeIdsRaw) {
                Long userId = Long.valueOf(rawId.toString());
                taskRepo.addAssignee(taskId, userId);
            }

            Optional<Task> updatedTaskOpt = taskRepo.findById(taskId);
            if (updatedTaskOpt.isPresent()) {
                Task updatedTask = updatedTaskOpt.get();
                updatedTask.setAssignees(
                        taskRepo.findAssigneesByTaskId(taskId));
                return ResponseEntity.ok(updatedTask);
            } else {
                return ResponseEntity.status(500).body(
                        Map.of("message", "Error retrieving updated task"));
            }
        });
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deleteMultipleTasks(
            @RequestBody List<Long> taskIds,
            HttpServletRequest request) {
        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        if (taskIds == null || taskIds.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No task IDs provided"));
        }

        return jdbi.inTransaction(handle -> {
            User currentUser = handle
                    .attach(UserRepository.class)
                    .findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());

            List<Long> accessibleTaskIds = taskIds;

            if (!isManager) {
                accessibleTaskIds = new ArrayList<>();
                TaskRepository taskRepo = handle.attach(TaskRepository.class);

                for (Long taskId : taskIds) {
                    Optional<Task> taskOpt = taskRepo.findById(taskId);
                    if (taskOpt.isPresent()) {
                        Task task = taskOpt.get();
                        boolean isTeamMember = currentUser.getTeamId() != null &&
                                task.getTeamId() != null &&
                                currentUser.getTeamId().equals(task.getTeamId());

                        if (isTeamMember) {
                            accessibleTaskIds.add(taskId);
                        }
                    }
                }
            }

            if (accessibleTaskIds.isEmpty()) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "No tasks available for deletion"));
            }

            handle
                    .attach(TaskRepository.class)
                    .deleteMultiple(accessibleTaskIds);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tasks deleted");
            response.put("count", accessibleTaskIds.size());

            return ResponseEntity.ok(response);
        });
    }

}
