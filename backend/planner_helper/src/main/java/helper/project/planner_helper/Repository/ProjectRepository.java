package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;

public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {
        @Query("SELECT t FROM ProjectEntity t WHERE t.owner.id = :userId")
        List<ProjectEntity> findProjectByUserId(
                        @Param("userId") UUID userId);

        @Query("SELECT p FROM ProjectEntity p JOIN p.users u WHERE p.id = :projectId AND u.id = :userId")
        Optional<ProjectEntity> findUserInProject(
                        @Param("userId") UUID userId, @Param("projectId") UUID projectId);

        @Query("SELECT p.users FROM ProjectEntity p WHERE p.id = :projectId")
        List<UserEntity> getUsersInProject(@Param("projectId") UUID projectId);

        @Query("SELECT p FROM ProjectEntity p LEFT JOIN FETCH p.columns WHERE p.id = :id")
        Optional<ProjectEntity> findByIdWithColumns(@Param("id") UUID id);
}
