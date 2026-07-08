package helper.project.planner_helper.DTO;

import helper.project.planner_helper.Types.Priority;

public record UserStoryRequest(
        String title,
        String roleContext,
        String wantContext,
        String benefitContext,
        String description,
        Priority priority,
        String status,
        Integer storyPoints,
        String epicId,
        String creatorId) {
}
