package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Kpi;
import com.springboot.MyTodoList.repository.KpiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kpis")
public class KpiController {

    private final KpiRepository kpiRepository;

    @Autowired
    public KpiController(KpiRepository kpiRepository) {
        this.kpiRepository = kpiRepository;
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
            @RequestParam(name = "sprintId", required = false) Long sprintId) {
        
        List<Kpi> kpis;
        if (sprintId != null) {
            kpis = kpiRepository.getCompletionRateByMemberAndSprint(sprintId);
        } else if (teamId != null) {
            kpis = kpiRepository.getCompletionRateByMemberAndTeam(teamId);
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
            dashboard.put("completedTasks", kpiRepository.getCompletedTasksByMemberAndTeam(teamId));
            dashboard.put("actualHours", kpiRepository.getTotalActualHoursByMemberAndTeam(teamId));
            dashboard.put("completionRate", kpiRepository.getCompletionRateByMemberAndTeam(teamId));
        } else {
            dashboard.put("completedTasks", kpiRepository.getCompletedTasksByMember());
            dashboard.put("actualHours", kpiRepository.getTotalActualHoursByMember());
            dashboard.put("completionRate", kpiRepository.getCompletionRateByMember());
        }
        
        return ResponseEntity.ok(dashboard);
    }
}