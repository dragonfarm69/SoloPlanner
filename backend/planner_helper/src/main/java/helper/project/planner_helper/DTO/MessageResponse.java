package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
                UUID id,
                String content,
                String role,
                Instant createdDate) {
}
