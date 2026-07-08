package helper.project.planner_helper.DTO;

import java.time.Instant;
import helper.project.planner_helper.Types.Priority;

public record UserStoryResponse(
        String id,
        String title,
        String roleContext,
        String wantContext,
        String benefitContext,
        String description,
        Priority priority,
        String status,
        Integer storyPoints,
        int taskCount,
        int completedTaskCount,
        Instant createdAt,
        Instant editedAt) {
}
