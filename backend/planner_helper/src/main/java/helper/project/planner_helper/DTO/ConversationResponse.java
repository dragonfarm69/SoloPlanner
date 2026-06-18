package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
                UUID id,
                String title,
                UUID userId,
                UUID projectId,
                Instant createdDate,
                Instant lastEdited) {
}
