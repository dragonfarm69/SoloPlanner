package helper.project.planner_helper.Handler;

import java.util.List;
import java.util.UUID;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.grpc.server.service.GrpcService;

import helper.project.planner_helper.AIEvent;
import helper.project.planner_helper.AIEventSubscribeRequest;
import helper.project.planner_helper.ColumnOption;
import helper.project.planner_helper.CreateTaskRequest;
import helper.project.planner_helper.CreateTaskResponse;
import helper.project.planner_helper.PriorityOption;
import helper.project.planner_helper.Project;
import helper.project.planner_helper.ProjectGrpcServiceGrpc;
import helper.project.planner_helper.TagOption;
import helper.project.planner_helper.TaskBlueprintRequest;
import helper.project.planner_helper.TaskBlueprintResponse;
import helper.project.planner_helper.UserProjectsRequest;
import helper.project.planner_helper.UserProjectsResponse;
import helper.project.planner_helper.DTO.Blueprint.ProjectSummary;
import helper.project.planner_helper.DTO.ProjectTaskRequest;
import helper.project.planner_helper.DTO.UserProjectResponse;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Services.AIChatStreamService;
import helper.project.planner_helper.Services.ProjectService;
import helper.project.planner_helper.Services.TaskService;
import helper.project.planner_helper.Types.Priority;
import io.grpc.Context;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;

@GrpcService
public class ProjectGrpcHandler extends
                ProjectGrpcServiceGrpc.ProjectGrpcServiceImplBase {
        private final ProjectService projectService;
        private final TaskService taskService;
        private final AIChatStreamService aiChatStreamService;

        public ProjectGrpcHandler(ProjectService projectService, TaskService taskService,
                        AIChatStreamService aiChatStreamService) {
                this.projectService = projectService;
                this.taskService = taskService;
                this.aiChatStreamService = aiChatStreamService;
        }

        @Override
        public void getUserProjects(UserProjectsRequest request, StreamObserver<UserProjectsResponse> repObserver) {
                try {
                        String userId = request.getUserId();
                        if (userId.isEmpty()) {
                                repObserver.onError(Status.INVALID_ARGUMENT.withDescription("Invalid user id")
                                                .asRuntimeException());
                                return;
                        }

                        UUID userUUID = UUID.fromString(userId);

                        List<UserProjectResponse> projects = projectService.getUserProjects(userUUID);

                        UserProjectsResponse.Builder repBuilder = UserProjectsResponse.newBuilder();

                        for (UserProjectResponse project : projects) {
                                Project protoProject = Project.newBuilder()
                                                .setId(project.id().toString())
                                                .setTitle(project.title())
                                                .setDescription(project.description() != null ? project.description()
                                                                : "")
                                                .setOwnerId(project.ownerId() != null ? project.ownerId().toString()
                                                                : "")
                                                .setGroupId(project.groupId() != null ? project.groupId().toString()
                                                                : "")
                                                .build();
                                repBuilder.addProjects(protoProject);
                        }

                        repObserver.onNext(repBuilder.build()); // stream data
                        repObserver.onCompleted(); // close connection
                } catch (IllegalArgumentException e) {
                        repObserver.onError(Status.INVALID_ARGUMENT
                                        .withDescription("Invalid UUID format: " + e.getMessage())
                                        .asRuntimeException());
                }
        }

        @Override
        public void getProjectTaskBlueprint(TaskBlueprintRequest request,
                        StreamObserver<TaskBlueprintResponse> repObserver) {
                try {
                        String projectId = request.getProjectId();
                        if (projectId.isEmpty()) {
                                repObserver.onError(Status.INVALID_ARGUMENT.withDescription("Invalid project id")
                                                .asRuntimeException());
                                return;
                        }

                        ProjectSummary projectSummary = projectService.constructTaskCreationBlueprint(projectId);

                        List<ColumnOption> columnOptions = projectSummary.columnOptions().stream()
                                        .map(c -> ColumnOption.newBuilder()
                                                        .setId(c.id())
                                                        .setName(c.name())
                                                        .setColor(c.color())
                                                        .build())
                                        .toList();

                        List<PriorityOption> priorityOptions = projectSummary.priorityOptions().stream()
                                        .map(p -> PriorityOption.newBuilder()
                                                        .setPriority(p.name())
                                                        .build())
                                        .toList();

                        List<TagOption> tagOptions = projectSummary.tagOptions().stream()
                                        .map(t -> TagOption.newBuilder()
                                                        .setId(t.id())
                                                        .setName(t.name())
                                                        .setColor(t.color())
                                                        .build())
                                        .toList();

                        TaskBlueprintResponse.Builder repBuilder = TaskBlueprintResponse.newBuilder()
                                        .setTitle(projectSummary.title() != null ? projectSummary.title() : "")
                                        .setDescription(projectSummary.description() != null
                                                        ? projectSummary.description()
                                                        : "")
                                        .setCurrentDateTime(
                                                        projectSummary.currentDateTime() != null
                                                                        ? projectSummary.currentDateTime()
                                                                        : "")
                                        .addAllColumnOptions(columnOptions)
                                        .addAllPriorityOptions(priorityOptions)
                                        .addAllTagOptions(tagOptions);

                        repObserver.onNext(repBuilder.build()); // stream data
                        repObserver.onCompleted(); // close connection
                } catch (IllegalArgumentException e) {
                        repObserver.onError(Status.INVALID_ARGUMENT
                                        .withDescription("Invalid UUID format: " + e.getMessage())
                                        .asRuntimeException());
                }
        }

        @Override
        public void createTask(CreateTaskRequest request,
                        StreamObserver<CreateTaskResponse> repObserver) {
                try {
                        String projectId = request.getProjectId();
                        if (projectId.isEmpty()) {
                                repObserver.onError(Status.INVALID_ARGUMENT.withDescription("Invalid project id")
                                                .asRuntimeException());
                                return;
                        }

                        String columnId = request.getColumnId();
                        if (columnId.isEmpty()) {
                                repObserver.onError(Status.INVALID_ARGUMENT.withDescription("Invalid column id")
                                                .asRuntimeException());
                                return;
                        }

                        System.out.println("PRIORITY: " + request.getPriority());

                        Priority priority;
                        try {
                                priority = Priority.valueOf(request.getPriority());
                        } catch (IllegalArgumentException e) {
                                priority = Priority.LOW; // Default fallback
                        }

                        ProjectTaskRequest taskRequest = new ProjectTaskRequest(
                                        request.getTitle(),
                                        request.getDescription(),
                                        request.getTagIdsList(),
                                        request.getUserId(),
                                        request.getDeadline(),
                                        priority);

                        TaskEntity task = taskService.createTask(taskRequest, projectId, columnId);

                        List<helper.project.planner_helper.Tag> tags = task.getTags().stream()
                                        .map(t -> helper.project.planner_helper.Tag.newBuilder()
                                                        .setId(t.getId().toString())
                                                        .setName(t.getName())
                                                        .setColor(t.getColor())
                                                        .build())
                                        .toList();

                        CreateTaskResponse.Builder repBuilder = CreateTaskResponse.newBuilder()
                                        .setId(task.getId().toString())
                                        .setTitle(task.getTitle())
                                        .setPriority(task.getPriority().name())
                                        .setOrder(task.getOrder())
                                        .setColumnId(task.getColumn().getId().toString())
                                        .setUsername(task.getUser().getUsername())
                                        .setDeadline(task.getDeadline() != null ? task.getDeadline().toString() : "")
                                        .addAllTags(tags);

                        repObserver.onNext(repBuilder.build()); // stream data
                        repObserver.onCompleted(); // close connection
                } catch (IllegalArgumentException e) {
                        repObserver.onError(Status.INVALID_ARGUMENT
                                        .withDescription("Invalid UUID format: " + e.getMessage())
                                        .asRuntimeException());
                } catch (Exception e) {
                        repObserver.onError(Status.INTERNAL
                                        .withDescription("Failed to create task: " + e.getMessage())
                                        .asRuntimeException());
                }
        }

        /**
         * The AI microservice calls this once on startup and keeps the stream open.
         * Java pushes {@link AIEvent} messages onto {@code responseObserver} whenever
         * a user sends an AI chat message via WebSocket.
         */
        @Override
        public void subscribeAIEvents(AIEventSubscribeRequest request,
                        StreamObserver<AIEvent> responseObserver) {
                aiChatStreamService.registerObserver(responseObserver);

                // When the Go client disconnects or the call is cancelled, clear the reference
                // so we don't keep trying to write to a dead stream.
                Context.current().withCancellation().addListener(
                                context -> aiChatStreamService.clearObserver(),
                                Runnable::run);
        }
}
