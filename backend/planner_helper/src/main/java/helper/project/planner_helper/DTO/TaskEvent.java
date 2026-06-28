package helper.project.planner_helper.DTO;

import java.util.List;

import helper.project.planner_helper.DTO.Events.TagResponse;

public record TaskEvent(
        String id,
        String title,
        String priority,
        String deadline,
        List<TagResponse> tags,
        String projectName,
        String projectId,
        String description) {

}
