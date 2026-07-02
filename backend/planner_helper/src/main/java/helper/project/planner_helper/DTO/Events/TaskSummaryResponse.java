package helper.project.planner_helper.DTO.Events;

import java.time.Instant;
import java.util.List;

public record TaskSummaryResponse(String id,
                String title,
                String priority,
                String order,
                String columnId,
                String username,
                Instant deadline,
                List<TagResponse> tags) {

}
