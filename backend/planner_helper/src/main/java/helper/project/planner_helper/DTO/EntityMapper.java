package helper.project.planner_helper.DTO;

import java.util.ArrayList;
import java.util.List;

import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.TaskEntity;

public class EntityMapper {
    public static TaskResponse mapToTaskResponse(TaskEntity task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getOrder(),
                task.getDeadline());
    }

    public static ColumnResponse mapToColumnResponse(TaskColumn column) {
        List<TaskResponse> taskReponses = new ArrayList<TaskResponse>();
        if (column.getTasks() != null) {
            for (TaskEntity task : column.getTasks()) {
                TaskResponse taskMapped = mapToTaskResponse(task);
                taskReponses.add(taskMapped);
            }
        }

        return new ColumnResponse(
                column.getId(),
                column.getName(),
                column.getColor(),
                column.getPosition(),
                taskReponses);
    }

    public static ProjectBoardResponse mapToProjectBoardResponse(ProjectEntity project) {
        List<ColumnResponse> columnReponses = new ArrayList<ColumnResponse>();
        if (project.getColumns() != null) {
            for (TaskColumn column : project.getColumns()) {
                ColumnResponse columnMapped = mapToColumnResponse(column);
                columnReponses.add(columnMapped);
            }
        }

        return new ProjectBoardResponse(
                project.getTitle(),
                columnReponses);
    }
}
