package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.ConversationEntity;

public interface ConversationRepository extends JpaRepository<ConversationEntity, UUID> {
        // Get all conversations for a specific user in a specific project
        @Query("SELECT c FROM ConversationEntity c WHERE c.project.id = :projectId AND c.user.id = :userId ORDER BY c.createdDate DESC")
        List<ConversationEntity> findByProjectIdAndUserId(
                        @Param("projectId") UUID projectId, @Param("userId") UUID userId);

        // Find a single conversation, but only if the requesting user owns it (access control)
        @Query("SELECT c FROM ConversationEntity c WHERE c.id = :conversationId AND c.user.id = :userId")
        Optional<ConversationEntity> findByIdAndUserId(
                        @Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
