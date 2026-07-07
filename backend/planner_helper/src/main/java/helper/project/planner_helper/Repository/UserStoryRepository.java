package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import helper.project.planner_helper.Database.UserStoryEntity;

@Repository
public interface UserStoryRepository extends JpaRepository<UserStoryEntity, UUID> {
    @Query("SELECT us FROM UserStoryEntity us WHERE us.project.id = :projectId AND us.archived = false")
    List<UserStoryEntity> findActiveByProjectId(@Param("projectId") UUID projectId);
}
