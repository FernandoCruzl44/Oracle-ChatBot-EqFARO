package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Kpi;
import com.springboot.MyTodoList.repository.KpiRepository;
import org.jdbi.v3.core.Jdbi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kpis")
public class KpiController {

    private final KpiRepository kpiRepository;

    @Autowired
    public KpiController(Jdbi jdbi) {
        this.kpiRepository = jdbi.onDemand(KpiRepository.class);
    }

    @GetMapping("/completed-tasks")
    public ResponseEntity<List<Kpi>> getCompletedTasksByMember(
            @RequestParam(name = "teamId", required = false) Long teamId) {

        List<Kpi> kpis;
        if (teamId != null) {
            kpis = kpiRepository.getCompletedTasksByMemberAndTeam(teamId);
        } else {
            kpis = kpiRepository.getCompletedTasksByMember();
        }

        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/actual-hours")
    public ResponseEntity<List<Kpi>> getTotalActualHoursByMember(
            @RequestParam(name = "teamId", required = false) Long teamId) {

        List<Kpi> kpis;
        if (teamId != null) {
            kpis = kpiRepository.getTotalActualHoursByMemberAndTeam(teamId);
        } else {
            kpis = kpiRepository.getTotalActualHoursByMember();
        }

        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/completion-rate")
    public ResponseEntity<List<Kpi>> getCompletionRateByMember(
            @RequestParam(name = "teamId", required = false) Long teamId,
            @RequestParam(name = "sprintId", required = false) Long sprintId,
            @RequestParam(name = "aggregated", required = false) Boolean aggregated) {

        List<Kpi> kpis;

        if (sprintId != null) {
            kpis = kpiRepository.getCompletionRateByMemberAndSprint(sprintId);
        } else if (teamId != null) {
            if (Boolean.TRUE.equals(aggregated)) {
                kpis = kpiRepository.getCompletionRateBySprintAndTeam(teamId);
            } else {
                kpis = kpiRepository.getCompletionRateByMemberAndTeam(teamId);
            }
        } else {
            kpis = kpiRepository.getCompletionRateByMember();
        }

        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, List<Kpi>>> getDashboardData(
            @RequestParam(name = "teamId", required = false) Long teamId) {

        Map<String, List<Kpi>> dashboard = new HashMap<>();

        if (teamId != null) {
            // dashboard.put("completedTasks", kpiRepository.getCompletedTasksByMemberAndTeam(teamId));
            // dashboard.put("actualHours", kpiRepository.getTotalActualHoursByMemberAndTeam(teamId));
            // dashboard.put("completionRate", kpiRepository.getCompletionRateByMemberAndTeam(teamId));
            dashboard.put("completedTasks", kpiRepository.getCompletedTasksBySprintAndTeam(teamId));
            dashboard.put("actualHours", kpiRepository.getTotalActualHoursBySprintAndTeam(teamId));
            dashboard.put("completionRate", kpiRepository.getCompletionRateBySprintAndTeam(teamId));
        } else {
            dashboard.put("completedTasks", kpiRepository.getCompletedTasksByMember());
            dashboard.put("actualHours", kpiRepository.getTotalActualHoursByMember());
            dashboard.put("completionRate", kpiRepository.getCompletionRateByMember());
        }

        return ResponseEntity.ok(dashboard);
    }

    // Sprint Performance - Hours worked per sprint and member
    @GetMapping("/sprint-performance/hours")
    public ResponseEntity<List<Kpi>> getHoursPerSprintAndMember(
            @RequestParam(name = "teamId", required = false) Long teamId) {
        List<Kpi> kpis;
        
        if (teamId != null) {
            kpis = kpiRepository.getHoursPerSprintAndMember(teamId);
        } else {
            kpis = kpiRepository.getHoursPerSprintAndMemberAllTeams();
        }
        
        return ResponseEntity.ok(kpis);
    }

    // Developer Performance - Hours and tasks per sprint per developer
    @GetMapping("/developer-performance/hours")
    public ResponseEntity<List<Kpi>> getDeveloperHoursPerSprint(
            @RequestParam(name = "teamId", required = false) Long teamId) {
        List<Kpi> kpis;
        
        if (teamId != null) {
            kpis = kpiRepository.getDeveloperHoursPerSprint(teamId);
        } else {
            kpis = kpiRepository.getDeveloperHoursPerSprintAllTeams();
        }
        
        return ResponseEntity.ok(kpis);
    }

    @GetMapping("/developer-performance/tasks")
    public ResponseEntity<List<Kpi>> getDeveloperTasksPerSprint(
            @RequestParam(name = "teamId", required = false) Long teamId) {
        List<Kpi> kpis;
        
        if (teamId != null) {
            kpis = kpiRepository.getDeveloperTasksPerSprint(teamId);
        } else {
            kpis = kpiRepository.getDeveloperTasksPerSprintAllTeams();
        }
        
        return ResponseEntity.ok(kpis);
    }

    // Last Sprint Report - Detailed tasks per developer
    @GetMapping("/last-sprint/tasks")
    public ResponseEntity<List<Kpi>> getLastSprintTasks(
            @RequestParam(name = "teamId", required = false) Long teamId) {
        List<Kpi> kpis = kpiRepository.getLastSprintTasksByDeveloper(teamId);
        return ResponseEntity.ok(kpis);
    }

    // Specific Sprint Tasks - Get tasks for a specific sprint
    @GetMapping("/sprint/{sprintId}/tasks")
    public ResponseEntity<List<Kpi>> getSprintTasks(
            @PathVariable Long sprintId,
            @RequestParam(name = "teamId", required = false) Long teamId) {
        List<Kpi> kpis = kpiRepository.getSprintTasksByDeveloper(sprintId, teamId);
        return ResponseEntity.ok(kpis);
    }
}
