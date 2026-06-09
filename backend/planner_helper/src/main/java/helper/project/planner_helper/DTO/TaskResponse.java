package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(UUID id,
        String title,
        String description,
        String priority,
        int order,
        Instant deadline) {

}
