package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.TaskEntity;

public interface TaskRepository extends JpaRepository<TaskEntity, UUID> {
        @Query("SELECT t FROM TaskEntity t WHERE t.project.id = :projectId")
        List<TaskEntity> findTaskByProjectId(
                        @Param("projectId") UUID projectId);

        @Query("SELECT t FROM TaskEntity t WHERE t.user.id = :userId")
        List<TaskEntity> findTaskByUserId(
                        @Param("userId") UUID userId);

        @Query("SELECT t FROM TaskEntity t WHERE t.project.id = :projectId AND t.column.id = :columnId ORDER BY t.order DESC LIMIT 1")
        Optional<TaskEntity> findLatestTaskByProjectId(
                        @Param("projectId") UUID projectId, @Param("columnId") UUID columnId);

        @Query("SELECT t FROM TaskEntity t WHERE t.project.id = :projectId ORDER BY t.order ASC")
        List<TaskEntity> findTasksByProjectIdOrdered(
                        @Param("projectId") UUID projectId);
}
