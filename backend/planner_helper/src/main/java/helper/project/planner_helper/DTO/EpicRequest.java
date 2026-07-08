package helper.project.planner_helper.DTO;

import helper.project.planner_helper.Types.Priority;
import jakarta.validation.constraints.NotBlank;

public record EpicRequest(
    @NotBlank String title,
    String description,
    Priority priority,
    String status,
    String creatorId
) {}
