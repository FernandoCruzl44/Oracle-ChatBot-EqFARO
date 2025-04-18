package com.springboot.MyTodoList.model;

import java.math.BigDecimal;

public class Kpi {
    private String memberName;
    private Integer completedTasks;
    private Integer totalAssignedTasks;
    private BigDecimal completionRatePercent;
    private Double totalActualHours;
    private Double totalEstimatedHours;

    // Getters y setters
    public String getMemberName() {
        return memberName;
    }

    public void setMemberName(String memberName) {
        this.memberName = memberName;
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
}