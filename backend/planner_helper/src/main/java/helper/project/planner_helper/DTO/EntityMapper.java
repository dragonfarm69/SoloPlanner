package helper.project.planner_helper.DTO;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import helper.project.planner_helper.DTO.Events.ColumnResponse;
import helper.project.planner_helper.DTO.Events.TagResponse;
import helper.project.planner_helper.DTO.Events.TaskResponse;
import helper.project.planner_helper.DTO.Events.TaskSummaryResponse;
import helper.project.planner_helper.Database.ConversationEntity;
import helper.project.planner_helper.Database.GroupEntity;
import helper.project.planner_helper.Database.MessageEntity;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TagEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Database.UserEntity;

public class EntityMapper {
    public static TaskResponse mapToTaskResponse(TaskEntity task) {
        List<TagResponse> tagResponses = new ArrayList<>();
        if (task.getTags() != null) {
            for (TagEntity tag : task.getTags()) {
                TagResponse response = mapToTagResponses(tag);
                tagResponses.add(response);
            }
        }
        return new TaskResponse(
                task.getId().toString(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getOrder(),
                task.getColumn().getId().toString(),
                task.getUser().getUsername(),
                tagResponses,
                task.getDeadline(),
                task.getCreatedDate(),
                task.getLastEdited(),
                task.getIsArchived());
    }

    public static TaskSummaryResponse mapToTaskSummaryResponse(TaskEntity task) {
        List<TagResponse> tagResponses = new ArrayList<>();
        if (task.getTags() != null) {
            for (TagEntity tag : task.getTags()) {
                TagResponse response = mapToTagResponses(tag);
                tagResponses.add(response);
            }
        }
        return new TaskSummaryResponse(
                task.getId().toString(),
                task.getTitle(),
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getOrder(),
                task.getColumn().getId().toString(),
                task.getUser().getUsername(),
                task.getDeadline(),
                tagResponses);
    }

    public static TaskSummaryResponse mapToTaskArchivedSummaryResponse(TaskEntity task) {
        List<TagResponse> tagResponses = new ArrayList<>();
        if (task.getTags() != null) {
            for (TagEntity tag : task.getTags()) {
                TagResponse response = mapToTagResponses(tag);
                tagResponses.add(response);
            }
        }
        return new TaskSummaryResponse(
                task.getId().toString(),
                task.getTitle(),
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getOrder(),
                task.getColumn().getId().toString(),
                task.getUser().getUsername(),
                task.getDeadline(),
                tagResponses);
    }

    public static TaskEvent mapToTaskEvent(TaskEntity task) {
        List<TagResponse> tagResponses = new ArrayList<>();
        if (task.getTags() != null) {
            for (TagEntity tag : task.getTags()) {
                TagResponse response = mapToTagResponses(tag);
                tagResponses.add(response);
            }
        }

        return new TaskEvent(
                task.getId().toString(),
                task.getTitle(),
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getDeadline().toString(),
                tagResponses,
                task.getProject().getTitle(),
                task.getProject().getId().toString(),
                task.getDescription());
    }

    public static ColumnResponse mapToColumnResponse(TaskColumn column) {
        List<TaskSummaryResponse> taskReponses = new ArrayList<TaskSummaryResponse>();
        if (column.getTasks() != null) {
            for (TaskEntity task : column.getTasks()) {
                // skip archived task
                if (task.getIsArchived()) {
                    continue;
                }
                TaskSummaryResponse taskMapped = mapToTaskSummaryResponse(task);
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
                task.setDeadline(java.time.Instant.parse(taskRequest.deadline()));
            } catch (Exception e1) {
                try {
                    java.time.LocalDate localDate = java.time.LocalDate.parse(taskRequest.deadline());
                    task.setDeadline(localDate.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
                } catch (Exception e2) {
                    System.err.println("Could not parse deadline date: " + taskRequest.deadline());
                }
            }
        }

        return task;
    }

    public static UserResponse mapToUserResponse(UserEntity user) {
        return new UserResponse(
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getId().toString());
    }

    public static UUID mapToUUID(String id) {
        if (id == null || id.trim().isEmpty() || id.equals("null")) {
            return null;
        }
        return UUID.fromString(id);
    }

    public static ConversationResponse mapToConversationResponse(ConversationEntity conversation) {
        return new ConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getUser().getId(),
                conversation.getProject().getId(),
                conversation.getCreatedDate(),
                conversation.getLastEdited());
    }

    public static MessageResponse mapToMessageResponse(MessageEntity message) {
        return new MessageResponse(
                message.getId(),
                message.getContent(),
                message.getRole().name(),
                message.getCreatedDate());
    }

    public static TagResponse mapToTagResponses(TagEntity tag) {
        return new TagResponse(
                tag.getId(),
                tag.getName(),
                tag.getColor());
    }

    public static ProjectUserSummary mapToProjectUserSummary(UserEntity user) {
        return new ProjectUserSummary(
                user.getId().toString(),
                user.getUsername());
    }

    public static GroupResponse mapToGroupResponse(GroupEntity group) {
        List<UserResponse> userResponses = new ArrayList<>();
        if (group.getUsers() != null) {
            for (UserEntity user : group.getUsers()) {
                userResponses.add(mapToUserResponse(user));
            }
        }

        List<ProjectResponseRecord> projectResponses = new ArrayList<>();
        if (group.getProjects() != null) {
            for (ProjectEntity project : group.getProjects()) {
                List<UUID> userIds = project.getUsers() != null
                        ? project.getUsers().stream().map(UserEntity::getId).toList()
                        : List.of();
                UUID ownerId = project.getOwner() != null ? project.getOwner().getId() : null;
                projectResponses.add(new ProjectResponseRecord(
                        project.getId(),
                        project.getTitle(),
                        project.getDescription(),
                        ownerId,
                        userIds,
                        project.getCreatedDate(),
                        project.getLastEdited(),
                        group.getId()));
            }
        }

        return new GroupResponse(
                group.getId() != null ? group.getId().toString() : null,
                group.getName(),
                group.getInviteCode(),
                userResponses,
                projectResponses);
    }
}
