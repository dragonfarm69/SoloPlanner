package helper.project.planner_helper.Repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    @Query("SELECT t FROM UserEntity t WHERE t.identity = :identity")
    UserEntity findUserByUserId(
            @Param("identity") String identity);
}
