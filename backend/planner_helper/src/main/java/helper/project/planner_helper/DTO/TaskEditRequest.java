package helper.project.planner_helper.DTO;

import java.time.Instant;
import java.util.List;

import helper.project.planner_helper.Types.Priority;

public record TaskEditRequest(
        String title,
        String description,
        Priority priority,
        Instant deadline,
        List<String> tagIds,
        String userId) {
}
