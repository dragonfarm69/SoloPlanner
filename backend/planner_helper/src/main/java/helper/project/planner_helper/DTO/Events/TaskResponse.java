package helper.project.planner_helper.DTO.Events;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(UUID id,
        String title,
        String description,
        String priority,
        String order,
        String columnId,
        String username,
        Instant deadline) {

}
