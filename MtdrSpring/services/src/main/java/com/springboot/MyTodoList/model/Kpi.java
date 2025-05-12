package com.springboot.MyTodoList.model;

import java.math.BigDecimal;

public class Kpi {
    private String memberName;
    private String sprintName;
    private String taskTitle;
    private String taskDescription;
    private String taskStatus;
    private Integer completedTasks;
    private Integer totalAssignedTasks;
    private BigDecimal completionRatePercent;
    private Double totalActualHours;
    private Double totalEstimatedHours;
    private Long teamId;
    private String teamName;
    private Long sprintId;

    // Getters and setters
    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public String getTaskStatus() {
        return taskStatus;
    }

    public void setTaskStatus(String taskStatus) {
        this.taskStatus = taskStatus;
    }

    public Integer getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(Integer completedTasks) {
        this.completedTasks = completedTasks;
    }

    public Integer getTotalAssignedTasks() {
        return totalAssignedTasks;
    }

    public void setTotalAssignedTasks(Integer totalAssignedTasks) {
        this.totalAssignedTasks = totalAssignedTasks;
    }

    public BigDecimal getCompletionRatePercent() {
        return completionRatePercent;
    }

    public void setCompletionRatePercent(BigDecimal completionRatePercent) {
        this.completionRatePercent = completionRatePercent;
    }

    public Double getTotalActualHours() {
        return totalActualHours;
    }

    public void setTotalActualHours(Double totalActualHours) {
        this.totalActualHours = totalActualHours;
    }

    public Double getTotalEstimatedHours() {
        return totalEstimatedHours;
    }

    public void setTotalEstimatedHours(Double totalEstimatedHours) {
        this.totalEstimatedHours = totalEstimatedHours;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public Long getSprintId() {
        return sprintId;
    }

    public void setSprintId(Long sprintId) {
        this.sprintId = sprintId;
    }
}