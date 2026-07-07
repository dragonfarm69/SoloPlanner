package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.List;
import helper.project.planner_helper.Types.Priority;

public record UserStoryDetailsResponse(
        String id,
        String title,
        String roleContext,
        String wantContext,
        String benefitContext,
        String description,
        Priority priority,
        String status,
        Integer storyPoints,
        Instant createdAt,
        Instant editedAt,
        String parentId,
        List<TaskSummary> tasks,
        List<UserStorySummary> subStories) {
    public record TaskSummary(
            String id,
            String title,
            String status) {
    }

    public record UserStorySummary(
            String id,
            String title,
            String status,
            Integer storyPoints) {
    }
}
