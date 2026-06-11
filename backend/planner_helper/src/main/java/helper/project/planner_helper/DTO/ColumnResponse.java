package helper.project.planner_helper.DTO;

import java.util.List;
import java.util.UUID;

public record ColumnResponse(UUID id,
                String name,
                String color,
                String position,
                List<TaskResponse> tasks) {

}
