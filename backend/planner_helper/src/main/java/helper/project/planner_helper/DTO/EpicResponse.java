package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.List;

import helper.project.planner_helper.Types.Priority;

public record EpicResponse(
                String id,
                String title,
                String description,
                Priority priority,
                String status,
                boolean archived,
                String creatorId,
                String creatorUsername,
                List<UserStorySummary> userStories,
                Instant createdAt,
                Instant editedAt) {

        public record UserStorySummary(
                        String id,
                        String title,
                        String status,
                        Integer storyPoints) {
        }
}
