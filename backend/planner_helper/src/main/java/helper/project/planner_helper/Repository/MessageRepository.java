package helper.project.planner_helper.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import helper.project.planner_helper.Database.MessageEntity;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {
        // Get all messages in a conversation, ordered chronologically
        @Query("SELECT m FROM MessageEntity m WHERE m.conversation.id = :conversationId ORDER BY m.createdDate ASC")
        List<MessageEntity> findByConversationIdOrdered(
                        @Param("conversationId") UUID conversationId);
}
