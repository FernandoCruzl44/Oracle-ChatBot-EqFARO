package com.springboot.MyTodoList.controller;

import org.jdbi.v3.core.Jdbi;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.Team;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.repository.TeamRepository;
import com.springboot.MyTodoList.IdentityUtil;

import javax.servlet.http.HttpServletRequest;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sprints")
public class SprintController {

    private final Jdbi jdbi;
    private final IdentityUtil identityUtil;

    public SprintController(Jdbi jdbi, IdentityUtil identityUtil) {
        this.jdbi = jdbi;
        this.identityUtil = identityUtil;
    }

    @GetMapping
    public ResponseEntity<?> getSprints(
            @RequestParam(required = false) Long teamId,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            List<Sprint> sprints;

            if (teamId != null) {
                if (!isManager && (currentUser.getTeamId() == null || !currentUser.getTeamId().equals(teamId))) {
                    return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
                }
                sprints = sprintRepo.findByTeamId(teamId);
            } else if (isManager) {
                sprints = sprintRepo.findAll();
            } else {
                if (currentUser.getTeamId() == null) {
                    return ResponseEntity.ok(List.of());
                }
                sprints = sprintRepo.findByTeamId(currentUser.getTeamId());
            }

            return ResponseEntity.ok(sprints);
        });
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSprint(
            @PathVariable Long id,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(id);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean hasTeamAccess = currentUser.getTeamId() != null &&
                    currentUser.getTeamId().equals(sprint.getTeamId());

            if (!isManager && !hasTeamAccess) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }

            return ResponseEntity.ok(sprint);
        });
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<?> getSprintTasks(
            @PathVariable Long id,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(id);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean hasTeamAccess = currentUser.getTeamId() != null &&
                    currentUser.getTeamId().equals(sprint.getTeamId());

            if (!isManager && !hasTeamAccess) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }

            List<Task> tasks = sprintRepo.findTasksBySprint(id);
            TaskRepository taskRepo = handle.attach(TaskRepository.class);

            for (Task task : tasks) {
                task.setAssignees(taskRepo.findAssigneesByTaskId(task.getId()));
                if (task.getCreatorId() != null) {
                    userRepo.findById(task.getCreatorId()).ifPresent(
                            creator -> task.setCreatorName(creator.getName()));
                }
            }

            return ResponseEntity.ok(tasks);
        });
    }

    @GetMapping("/{id}/incomplete-tasks")
    public ResponseEntity<?> getSprintIncompleteTasks(
            @PathVariable Long id,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(id);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean hasTeamAccess = currentUser.getTeamId() != null &&
                    currentUser.getTeamId().equals(sprint.getTeamId());

            if (!isManager && !hasTeamAccess) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }

            List<Task> incompleteTasks = sprintRepo.findIncompleteTasksBySprint(id);
            TaskRepository taskRepo = handle.attach(TaskRepository.class);

            for (Task task : incompleteTasks) {
                task.setAssignees(taskRepo.findAssigneesByTaskId(task.getId()));
                if (task.getCreatorId() != null) {
                    userRepo.findById(task.getCreatorId()).ifPresent(
                            creator -> task.setCreatorName(creator.getName()));
                }
            }

            return ResponseEntity.ok(incompleteTasks);
        });
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createSprint(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {

        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"manager".equals(currentUser.getRole())) {
                return ResponseEntity.status(403).body(Map.of("message", "Only managers can create sprints"));
            }

            if (!request.containsKey("teamId") || !request.containsKey("startDate") ||
                    !request.containsKey("endDate")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Team ID, start date, and end date are required"));
            }

            Long teamId = Long.valueOf(request.get("teamId").toString());

            TeamRepository teamRepo = handle.attach(TeamRepository.class);
            Optional<Team> teamOpt = teamRepo.findById(teamId);
            if (!teamOpt.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Team not found"));
            }

            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            Date startDate, endDate;
            try {
                startDate = dateFormat.parse(request.get("startDate").toString());
                endDate = dateFormat.parse(request.get("endDate").toString());

                if (startDate.after(endDate)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Start date cannot be after end date"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid date format. Use yyyy-MM-dd"));
            }

            Sprint sprint = new Sprint();
            sprint.setTeamId(teamId);
            sprint.setStartDate(startDate);
            sprint.setEndDate(endDate);

            sprint.setName(request.containsKey("name") ? request.get("name").toString()
                    : "Sprint " + new SimpleDateFormat("yyyy-MM-dd").format(startDate));
            sprint.setStatus(request.containsKey("status") ? request.get("status").toString() : "PLANNED");

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Long sprintId = sprintRepo.insert(sprint);

            Optional<Sprint> createdSprint = sprintRepo.findById(sprintId);
            if (!createdSprint.isPresent()) {
                throw new RuntimeException("Failed to retrieve created sprint");
            }

            return ResponseEntity.ok(createdSprint.get());
        });
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateSprint(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {

        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"manager".equals(currentUser.getRole())) {
                return ResponseEntity.status(403).body(Map.of("message", "Only managers can update sprints"));
            }

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(id);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            if (request.containsKey("name")) {
                sprint.setName(request.get("name").toString());
            }

            if (request.containsKey("status")) {
                sprint.setStatus(request.get("status").toString());
            }

            if (request.containsKey("startDate")) {
                try {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    Date startDate = dateFormat.parse(request.get("startDate").toString());
                    sprint.setStartDate(startDate);
                } catch (Exception e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Invalid start date format. Use yyyy-MM-dd"));
                }
            }

            if (request.containsKey("endDate")) {
                try {
                    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
                    Date endDate = dateFormat.parse(request.get("endDate").toString());
                    sprint.setEndDate(endDate);
                } catch (Exception e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Invalid end date format. Use yyyy-MM-dd"));
                }
            }

            if (sprint.getStartDate().after(sprint.getEndDate())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Start date cannot be after end date"));
            }

            sprintRepo.update(sprint);

            return ResponseEntity.ok(sprint);
        });
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteSprint(
            @PathVariable Long id,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"manager".equals(currentUser.getRole())) {
                return ResponseEntity.status(403).body(Map.of("message", "Only managers can delete sprints"));
            }

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(id);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            List<Task> sprintTasks = sprintRepo.findTasksBySprint(id);

            for (Task task : sprintTasks) {
                sprintRepo.removeTaskFromSprint(task.getId());
            }

            sprintRepo.delete(id);

            return ResponseEntity.ok(Map.of("message", "Sprint deleted"));
        });
    }

    @PutMapping("/{sprintId}/tasks")
    @Transactional
    public ResponseEntity<?> assignTasksToSprint(
            @PathVariable Long sprintId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {

        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(sprintId);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean hasTeamAccess = currentUser.getTeamId() != null &&
                    currentUser.getTeamId().equals(sprint.getTeamId());

            if (!isManager && !hasTeamAccess) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }

            if (!request.containsKey("taskIds") || !(request.get("taskIds") instanceof List)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Task IDs list is required"));
            }

            @SuppressWarnings("unchecked")
            List<Integer> taskIds = (List<Integer>) request.get("taskIds");

            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            Map<String, Object> result = new HashMap<>();
            result.put("successful", 0);
            result.put("failed", 0);

            for (Integer taskId : taskIds) {
                Optional<Task> taskOpt = taskRepo.findById(taskId.longValue());
                if (!taskOpt.isPresent()) {
                    result.put("failed", (Integer) result.get("failed") + 1);
                    continue;
                }

                Task task = taskOpt.get();

                if (!task.getTeamId().equals(sprint.getTeamId())) {
                    result.put("failed", (Integer) result.get("failed") + 1);
                    continue;
                }

                int updated = sprintRepo.assignTaskToSprint(task.getId(), sprintId);
                if (updated > 0) {
                    result.put("successful", (Integer) result.get("successful") + 1);
                } else {
                    result.put("failed", (Integer) result.get("failed") + 1);
                }
            }

            return ResponseEntity.ok(result);
        });
    }

    @DeleteMapping("/{sprintId}/tasks/{taskId}")
    @Transactional
    public ResponseEntity<?> removeTaskFromSprint(
            @PathVariable Long sprintId,
            @PathVariable Long taskId,
            HttpServletRequest request) {

        Long currentUserId = identityUtil.getCurrentUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(sprintId);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            boolean isManager = "manager".equals(currentUser.getRole());
            boolean hasTeamAccess = currentUser.getTeamId() != null &&
                    currentUser.getTeamId().equals(sprint.getTeamId());

            if (!isManager && !hasTeamAccess) {
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            }

            TaskRepository taskRepo = handle.attach(TaskRepository.class);
            Optional<Task> taskOpt = taskRepo.findById(taskId);

            if (!taskOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Task task = taskOpt.get();

            if (task.getSprintId() == null || !task.getSprintId().equals(sprintId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Task is not assigned to this sprint"));
            }

            sprintRepo.removeTaskFromSprint(taskId);

            return ResponseEntity.ok(Map.of("message", "Task removed from sprint"));
        });
    }

    @PutMapping("/{sprintId}/end")
    @Transactional
    public ResponseEntity<?> endSprint(
            @PathVariable Long sprintId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {

        Long currentUserId = identityUtil.getCurrentUserId(httpRequest);
        if (currentUserId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        return jdbi.inTransaction(handle -> {
            UserRepository userRepo = handle.attach(UserRepository.class);
            User currentUser = userRepo.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"manager".equals(currentUser.getRole())) {
                return ResponseEntity.status(403).body(Map.of("message", "Only managers can end sprints"));
            }

            SprintRepository sprintRepo = handle.attach(SprintRepository.class);
            Optional<Sprint> sprintOpt = sprintRepo.findById(sprintId);

            if (!sprintOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Sprint sprint = sprintOpt.get();

            if (request.containsKey("incompleteTasksAction")) {
                String action = request.get("incompleteTasksAction").toString();

                if ("moveToBacklog".equals(action)) {
                    sprintRepo.moveIncompleteTasksToBacklog(sprintId);
                } else if ("moveToNextSprint".equals(action) && request.containsKey("nextSprintId")) {
                    Long nextSprintId = Long.valueOf(request.get("nextSprintId").toString());

                    Optional<Sprint> nextSprintOpt = sprintRepo.findById(nextSprintId);
                    if (!nextSprintOpt.isPresent()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "Next sprint not found"));
                    }

                    Sprint nextSprint = nextSprintOpt.get();
                    if (!nextSprint.getTeamId().equals(sprint.getTeamId())) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "Next sprint must belong to the same team"));
                    }

                    sprintRepo.moveIncompleteTasksToNewSprint(sprintId, nextSprintId);
                }
            }

            sprintRepo.updateSprintStatus(sprintId, "COMPLETED");

            return ResponseEntity.ok(Map.of("message", "Sprint completed successfully"));
        });
    }
}
