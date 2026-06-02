package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.ProjectEntity;

public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {
    @Query("SELECT t FROM ProjectEntity t WHERE t.owner.id = :userId")
    List<ProjectEntity> findProjectByUserId(
            @Param("userId") UUID userId);
}
