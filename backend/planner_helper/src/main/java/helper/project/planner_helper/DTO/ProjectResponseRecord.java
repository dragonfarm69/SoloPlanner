package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProjectResponseRecord(
        UUID id,
        String title,
        String description,
        UUID ownerId,
        List<UUID> userIds,
        Instant createdDate,
        Instant lastEdited) {
}
