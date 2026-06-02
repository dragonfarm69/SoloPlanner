package helper.project.planner_helper.Repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import helper.project.planner_helper.Database.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

}
