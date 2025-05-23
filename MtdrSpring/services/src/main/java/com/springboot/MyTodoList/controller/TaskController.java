package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.IdentityUtil;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import java.util.*;
import java.util.stream.Collectors;
import javax.servlet.http.HttpServletRequest;
import org.jdbi.v3.core.Jdbi;
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

    @GetMapping
    public ResponseEntity<?> getTasks(
            @RequestParam(required = false) String view_mode,
            @RequestParam(required = false) Long team_id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long created_by,
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "300") int limit,
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

        if (!request.containsKey("title") || request.get("title") == null
                || request.get("title").toString().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        }
        if (!request.containsKey("startDate") || request.get("startDate") == null
                || request.get("startDate").toString().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Start date is required"));
        }

        return jdbi.inTransaction(handle -> {
            Task task = new Task();
            task.setTitle((String) request.get("title"));
            task.setDescription((String) request.get("description"));
            task.setTag((String) request.get("tag"));
            task.setStatus((String) request.get("status"));
            task.setStartDate((String) request.get("startDate"));
            task.setEndDate((String) request.get("endDate"));
            task.setCreatorId(currentUserId);

            if (request.containsKey("estimated_hours") && request.get("estimated_hours") != null) {
                try {
                    task.setEstimatedHours(Double.valueOf(request.get("estimated_hours").toString()));
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid estimated_hours format"));
                }
            } else {
                task.setEstimatedHours(null);
            }

            if (request.containsKey("actual_hours") && request.get("actual_hours") != null) {
                try {
                    task.setActualHours(Double.valueOf(request.get("actual_hours").toString()));
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid actual_hours format"));
                }
            } else {
                task.setActualHours(null);
            }

            if (request.containsKey("team_id") && request.get("team_id") != null) {
                try {
                    task.setTeamId(Long.valueOf(request.get("team_id").toString()));
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid team_id format"));
                }
            } else {
                task.setTeamId(null);
            }

            if (request.containsKey("sprint_id") && request.get("sprint_id") != null) {
                try {
                    task.setSprintId(Long.valueOf(request.get("sprint_id").toString()));
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid sprint_id format"));
                }
            } else {
                task.setSprintId(null);
            }

            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            Long taskId = taskRepo.insert(task);

            if (request.containsKey("assignee_ids") &&
                    request.get("assignee_ids") != null) {
                @SuppressWarnings("unchecked")
                List<Object> rawIds = (List<Object>) request.get(
                        "assignee_ids");

                for (Object rawId : rawIds) {
                    try {
                        Long userId = Long.valueOf(rawId.toString());
                        taskRepo.addAssignee(taskId, userId);
                    } catch (NumberFormatException e) {
                        System.err.println("Invalid assignee ID format: " + rawId);
                    }
                }
            }

            Optional<Task> createdTaskOpt = taskRepo.findById(taskId);
            if (createdTaskOpt.isPresent()) {
                Task fullTask = createdTaskOpt.get();
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
            boolean isCreator = task.getCreatorId().equals(currentUserId);
            boolean isTeamMember = currentUser.getTeamId() != null &&
                    task.getTeamId() != null &&
                    currentUser.getTeamId().equals(task.getTeamId());
            boolean isAssigned = taskRepo.findAssigneesByTaskId(taskId)
                    .stream()
                    .anyMatch(user -> user.getId().equals(currentUserId));

            if (!isManager && !isCreator && !isTeamMember && !isAssigned) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "Forbidden: You cannot update this task"));
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
                Object endDateObj = request.get("endDate");
                task.setEndDate(endDateObj == null || endDateObj.toString().isEmpty() ? null : endDateObj.toString());
            }
            if (request.containsKey("team_id")) {
                Object teamIdObj = request.get("team_id");
                if (teamIdObj != null) {
                    try {
                        task.setTeamId(Long.valueOf(teamIdObj.toString()));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid team_id format"));
                    }
                } else {
                    task.setTeamId(null);
                }
            }

            if (request.containsKey("estimated_hours")) {
                Object estimatedHoursObj = request.get("estimated_hours");
                if (estimatedHoursObj == null) {
                    task.setEstimatedHours(null);
                } else {
                    try {
                        task.setEstimatedHours(Double.valueOf(estimatedHoursObj.toString()));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid estimated_hours format"));
                    }
                }
            }

            if (request.containsKey("actual_hours")) {
                Object actualHoursObj = request.get("actual_hours");
                if (actualHoursObj == null) {
                    task.setActualHours(null);
                } else {
                    try {
                        task.setActualHours(Double.valueOf(actualHoursObj.toString()));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid actual_hours format"));
                    }
                }
            }

            if (request.containsKey("sprint_id")) {
                Object sprintIdObj = request.get("sprint_id");
                if (sprintIdObj == null) {
                    task.setSprintId(null);
                } else {
                    try {
                        task.setSprintId(Long.valueOf(sprintIdObj.toString()));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid sprint_id format"));
                    }
                }
            }
            taskRepo.update(task);

            if (request.containsKey("assignee_ids")) {
                taskRepo.deleteAllAssignees(taskId);

                @SuppressWarnings("unchecked")
                List<Object> rawIds = (List<Object>) request.get("assignee_ids");

                if (rawIds != null) {
                    for (Object rawId : rawIds) {
                        try {
                            Long userId = Long.valueOf(rawId.toString());
                            taskRepo.addAssignee(taskId, userId);
                        } catch (NumberFormatException e) {
                            System.err.println("Invalid assignee ID format during update: " + rawId);
                        }
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

    @PostMapping("/delete-multiple")
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

            // delete
            if (!isManager) {
                accessibleTaskIds = new ArrayList<>();
                TaskRepository taskRepo = handle.attach(TaskRepository.class);

                for (Long taskId : taskIds) {
                    Optional<Task> taskOpt = taskRepo.findById(taskId);
                    if (taskOpt.isPresent()) {
                        Task task = taskOpt.get();
                        boolean isCreator = task.getCreatorId().equals(currentUserId);
                        boolean isTeamMember = currentUser.getTeamId() != null &&
                                task.getTeamId() != null &&
                                currentUser.getTeamId().equals(task.getTeamId());

                        if (isCreator || isTeamMember) {
                            accessibleTaskIds.add(taskId);
                        }
                    }
                }
            }

            if (accessibleTaskIds.isEmpty()) {
                if (!taskIds.isEmpty()) {
                    return ResponseEntity.status(403).body(
                            Map.of("message",
                                    "You do not have permission to delete one or more of the selected tasks"));
                } else {
                    return ResponseEntity.badRequest().body(Map.of("message", "No tasks available for deletion"));
                }
            }

            handle
                    .attach(TaskRepository.class)
                    .deleteMultiple(accessibleTaskIds);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tasks deleted");
            response.put("count", accessibleTaskIds.size());
            if (accessibleTaskIds.size() < taskIds.size()) {
                response.put("warning", "Some tasks could not be deleted due to permissions.");
            }

            return ResponseEntity.ok(response);
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
            boolean isCreator = task.getCreatorId().equals(currentUserId);
            boolean isTeamMember = currentUser.getTeamId() != null &&
                    task.getTeamId() != null &&
                    currentUser.getTeamId().equals(task.getTeamId());
            boolean isAssigned = taskRepo.findAssigneesByTaskId(taskId)
                    .stream()
                    .anyMatch(user -> user.getId().equals(currentUserId));

            if (!isManager && !isCreator && !isTeamMember && !isAssigned) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "Forbidden: You cannot update this task's status"));
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
                        Map.of("message", "Forbidden: Only managers or team members can assign tasks"));
            }

            taskRepo.deleteAllAssignees(taskId);

            for (Object rawId : assigneeIdsRaw) {
                try {
                    Long userId = Long.valueOf(rawId.toString());
                    taskRepo.addAssignee(taskId, userId);
                } catch (NumberFormatException e) {
                    System.err.println("Invalid assignee ID format during assign: " + rawId);
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

    @PostMapping("/migrate-sprint")
    @Transactional
    public ResponseEntity<?> migrateTaskSprint(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(
                    Map.of("message", "Unauthorized"));
        }

        // --- Extract data from the Map ---
        Long extractedTargetSprintId = null;
        List<Long> extractedTaskIds = null;

        if (request.containsKey("targetSprintId") && request.get("targetSprintId") != null) {
            try {
                extractedTargetSprintId = Long.valueOf(request.get("targetSprintId").toString());
            } catch (NumberFormatException e) {
                 return ResponseEntity.badRequest().body(Map.of("message", "Invalid targetSprintId format"));
            }
        } else {
             return ResponseEntity.badRequest().body(Map.of("message", "Target sprint ID is required."));
        }

        if (request.containsKey("taskIds") && request.get("taskIds") != null) {
             try {
                 @SuppressWarnings("unchecked")
                 List<?> rawIds = (List<?>) request.get("taskIds");
                 extractedTaskIds = rawIds.stream()
                                .map(obj -> Long.valueOf(obj.toString()))
                                .collect(Collectors.toList());
             } catch (ClassCastException | NumberFormatException e) {
                 return ResponseEntity.badRequest().body(Map.of("message", "Invalid taskIds format"));
             }
        }

        if (extractedTaskIds == null || extractedTaskIds.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Task IDs are required."));
        }
        // --- End of extraction ---

        // Declare final variables before the lambda
        final Long targetSprintId = extractedTargetSprintId;
        final List<Long> taskIds = extractedTaskIds;
        final Long finalCurrentUserId = currentUserId; // Also make currentUserId effectively final for lambda

        return jdbi.inTransaction(handle -> {
            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            UserRepository userRepo = handle.attach(UserRepository.class);

            Optional<Sprint> targetSprintOpt = sprintRepo.findById(targetSprintId); // Use final variable
            if (!targetSprintOpt.isPresent()) {
                return ResponseEntity.status(404).body(
                        Map.of("message", "Target sprint not found."));
            }
            Sprint targetSprint = targetSprintOpt.get();

            User currentUser = userRepo.findById(finalCurrentUserId) // Use final variable
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean isTargetTeamMember = currentUser.getTeamId() != null &&
                    targetSprint.getTeamId() != null &&
                    currentUser.getTeamId().equals(targetSprint.getTeamId());

            if (!isManager && !isTargetTeamMember) {
                 return ResponseEntity.status(403).body(
                        Map.of("message", "Forbidden: User cannot migrate tasks to this sprint's team."));
            }

            List<Task> tasksToMigrate = taskRepo.findByIds(taskIds); // Use final variable

            if (tasksToMigrate.size() != taskIds.size()) {
                 List<Long> foundIds = tasksToMigrate.stream().map(Task::getId).toList();
                 // Use final variable taskIds here as well
                 List<Long> notFoundIds = taskIds.stream().filter(id -> !foundIds.contains(id)).toList();
                 System.out.println("Warning: Some tasks not found for migration: " + notFoundIds);
            }

            for (Task task : tasksToMigrate) {
                boolean isTaskTeamMember = currentUser.getTeamId() != null &&
                        task.getTeamId() != null &&
                        currentUser.getTeamId().equals(task.getTeamId());

                if (!isManager && !isTaskTeamMember) {
                    boolean isAssigned = taskRepo.findAssigneesByTaskId(task.getId())
                            .stream()
                            .anyMatch(user -> user.getId().equals(finalCurrentUserId)); // Use final variable
                    if (!isAssigned) {
                        return ResponseEntity.status(403).body(
                                Map.of("message", "Forbidden: User cannot modify task ID " + task.getId()));
                    }
                }
            }

            int updatedRows = taskRepo.bulkUpdateSprintId(taskIds, targetSprintId); // Use final variables

            if (updatedRows != tasksToMigrate.size()) {
                 System.err.println("Warning: Number of updated tasks (" + updatedRows +
                                    ") does not match the number of tasks intended for migration (" +
                                    tasksToMigrate.size() + ").");
             }

            return ResponseEntity.ok(Map.of("message", "Tasks successfully migrated.", "count", updatedRows));
        });
    }

}
