package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import helper.project.planner_helper.Database.EpicEntity;

@Repository
public interface EpicRepository extends JpaRepository<EpicEntity, UUID> {
    @Query("SELECT e FROM EpicEntity e WHERE e.project.id = :projectId AND e.archived = false")
    List<EpicEntity> findActiveByProjectId(@Param("projectId") UUID projectId);
}
