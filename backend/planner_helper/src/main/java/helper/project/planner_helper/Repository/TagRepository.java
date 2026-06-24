package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.TagEntity;

public interface TagRepository extends JpaRepository<TagEntity, UUID> {
    @Query("SELECT t FROM TagEntity t WHERE t.project.id = :projectId")
    List<TagEntity> findByProjectId(@Param("projectId") UUID projectId);
}
