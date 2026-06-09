package helper.project.planner_helper.DTO;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import helper.project.planner_helper.Database.TagEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Types.Priority;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectTaskRequest(String title, String description, List<TagEntity> tags, int order, TaskColumn column,
                String deadline,
                Priority priority) {
}
