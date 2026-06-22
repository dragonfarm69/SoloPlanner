package helper.project.planner_helper.DTO;

import java.util.List;

import helper.project.planner_helper.Database.TagEntity;
import helper.project.planner_helper.Types.Priority;

public record ProjectTaskRequest(String title, String description, List<TagEntity> tags,
        String userId,
        String deadline,
        Priority priority) {

    public ProjectTaskRequest() {
        this("", "", java.util.Collections.emptyList(), "", "", Priority.LOW);
    }
}
