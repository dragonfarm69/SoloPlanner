package helper.project.planner_helper.DTO;

import java.util.ArrayList;
import java.util.List;

import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Database.UserEntity;

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

    // String title, String description, List<TagEntity> tags, int order, TaskColumn
    // column,
    // String deadline,
    // Priority priority
    public static TaskEntity mapToTaskEntity(ProjectTaskRequest taskRequest, ProjectEntity project, UserEntity user,
            TaskColumn column) {
        TaskEntity task = new TaskEntity();
        task.setTitle(taskRequest.title());
        task.setDescription(taskRequest.description());
        task.setColumn(column);
        task.setProject(project);
        task.setUser(user);
        task.setPriority(taskRequest.priority());

        if (taskRequest.deadline() != null && !taskRequest.deadline().trim().isEmpty()) {
            try {
                java.time.LocalDate localDate = java.time.LocalDate.parse(taskRequest.deadline());
                task.setDeadline(localDate.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
            } catch (Exception e) {
                // Fall back or keep null if format is invalid
            }
        }

        return task;
    }
}
