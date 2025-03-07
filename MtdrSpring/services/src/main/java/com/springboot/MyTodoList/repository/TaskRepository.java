// File: /services/src/main/java/com/springboot/MyTodoList/repository/TaskRepository.java
package com.springboot.MyTodoList.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.springboot.MyTodoList.model.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByTeamId(Long teamId);

	List<Task> findByStatus(String status);

	List<Task> findByTag(String tag);

	List<Task> findByAssigneesId(Long userId);

	List<Task> findByCreatorId(Long userId);

	@Query("SELECT t FROM Task t WHERE " +
			"(:teamId IS NULL OR t.team.id = :teamId) AND " +
			"(:status IS NULL OR t.status = :status) AND " +
			"(:tag IS NULL OR t.tag = :tag) AND " +
			"(:assignedTo IS NULL OR EXISTS (SELECT u FROM t.assignees u WHERE u.id = :assignedTo)) AND " +
			"(:createdBy IS NULL OR t.creator.id = :createdBy)")
	List<Task> findWithFilters(
			@Param("teamId") Long teamId,
			@Param("status") String status,
			@Param("tag") String tag,
			@Param("assignedTo") Long assignedTo,
			@Param("createdBy") Long createdBy,
			Pageable pageable);

	@Query("SELECT t FROM Task t WHERE " +
			"(:status IS NULL OR t.status = :status) AND " +
			"(:tag IS NULL OR t.tag = :tag) AND " +
			"(:assignedTo IS NULL OR EXISTS (SELECT u FROM t.assignees u WHERE u.id = :assignedTo)) AND " +
			"(:createdBy IS NULL OR t.creator.id = :createdBy)")
	List<Task> findAllTasksForManager(
			@Param("status") String status,
			@Param("tag") String tag,
			@Param("assignedTo") Long assignedTo,
			@Param("createdBy") Long createdBy,
			Pageable pageable);
}
