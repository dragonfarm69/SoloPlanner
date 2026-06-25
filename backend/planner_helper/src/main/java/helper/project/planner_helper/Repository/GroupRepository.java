package helper.project.planner_helper.Repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import helper.project.planner_helper.Database.GroupEntity;

public interface GroupRepository extends JpaRepository<GroupEntity, UUID> {
    Optional<GroupEntity> findByInviteCode(String inviteCode);
}
