package helper.project.planner_helper.DTO;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import helper.project.planner_helper.Database.TaskColumn;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectTasksResponse(
                UUID projectId,
                String title,
                List<TaskColumn> columns) {
}
