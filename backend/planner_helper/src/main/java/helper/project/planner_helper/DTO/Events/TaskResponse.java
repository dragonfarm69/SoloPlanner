package helper.project.planner_helper.DTO.Events;

import java.time.Instant;
import java.util.List;

public record TaskResponse(String id,
        String title,
        String description,
        String priority,
        String order,
        String columnId,
        String username,
        List<TagResponse> tags,
        Instant deadline,
        Instant createdDate,
        Instant lastEdited,
        boolean isArchived) {

}
