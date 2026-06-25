package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectResponseRecord(
                UUID id,
                String title,
                String description,
                UUID ownerId,
                List<UUID> userIds,
                Instant createdDate,
                Instant lastEdited,
                UUID groupId) {
}
