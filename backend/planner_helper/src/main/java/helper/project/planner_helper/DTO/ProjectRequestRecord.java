package helper.project.planner_helper.DTO;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectRequestRecord(
                String title,
                String description,
                UUID ownerId,
                List<UUID> userIds) {
}
