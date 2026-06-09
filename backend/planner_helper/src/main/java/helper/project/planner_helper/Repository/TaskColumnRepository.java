package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.TaskColumn;

public interface TaskColumnRepository extends JpaRepository<TaskColumn, UUID> {
    @Query("SELECT t FROM TaskColumn t WHERE t.project.id = :projectId")
    List<TaskColumn> findTaskByProjectId(
            @Param("projectId") UUID projectId);
}
