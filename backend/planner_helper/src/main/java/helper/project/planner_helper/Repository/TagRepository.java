package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import helper.project.planner_helper.Database.TagEntity;

public interface TagRepository extends JpaRepository<TagEntity, UUID> {
    List<TagEntity> findByProjectId(UUID projectId);
}
