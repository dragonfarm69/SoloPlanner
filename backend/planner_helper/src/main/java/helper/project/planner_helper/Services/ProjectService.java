package helper.project.planner_helper.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.ColumnPositionRequest;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.ProjectBoardResponse;
import helper.project.planner_helper.DTO.ProjectColumnRequest;
import helper.project.planner_helper.DTO.ProjectRequestRecord;
import helper.project.planner_helper.DTO.ProjectResponseRecord;
import helper.project.planner_helper.DTO.UserProjectResponse;
import helper.project.planner_helper.DTO.Blueprint.ColumnSummary;
import helper.project.planner_helper.DTO.Blueprint.PrioritySummary;
import helper.project.planner_helper.DTO.Blueprint.TagSummary;
import helper.project.planner_helper.DTO.Blueprint.ProjectSummary;
import helper.project.planner_helper.Types.Priority;
import helper.project.planner_helper.DTO.Events.ColumnResponse;
import helper.project.planner_helper.DTO.Events.EventPayload;
import helper.project.planner_helper.DTO.Events.TaskResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.TagRepository;
import helper.project.planner_helper.Repository.TaskColumnRepository;
import helper.project.planner_helper.Repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository; // final to make sure it is immutable
    private final UserRepository userRepository;
    private final TaskColumnRepository taskColumnRepository;
    private final TagRepository tagRepository;
    private final SimpMessagingTemplate mesageTemplate;

    // constructor
    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository,
            TaskColumnRepository taskColumnRepository, TagRepository tagRepository,
            SimpMessagingTemplate mesageTemplate) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskColumnRepository = taskColumnRepository;
        this.tagRepository = tagRepository;
        this.mesageTemplate = mesageTemplate;
    }

    public ProjectEntity findProject(UUID projecUuid) {
        ProjectEntity projectEntity = this.projectRepository.findById(projecUuid)
                .orElse(null);

        return projectEntity;
    }

    public boolean isUserInProject(UUID projecUuid, UUID userUuid) {
        ProjectEntity projectEntity = this.projectRepository.findUserInProject(userUuid, projecUuid)
                .orElse(null);

        return (projectEntity == null) ? false : true;
    }

    public List<UserProjectResponse> getUserProjects(UUID userId) {
        List<ProjectEntity> savedProjects = this.projectRepository.findProjectByUserId(userId);

        return savedProjects.stream().map(UserProjectResponse::new).toList();
    }

    public ProjectResponseRecord createProject(ProjectRequestRecord request) {
        ProjectEntity project = new ProjectEntity();

        project.setTitle(request.title());
        project.setDescription(request.description());

        UserEntity owner = this.userRepository.findById(request.ownerId()).orElseThrow();
        project.setOwner(owner);

        List<UserEntity> users = new ArrayList<>();
        users.add(owner);

        if (request.userIds() != null) {
            for (UUID uuid : request.userIds()) {
                if (!uuid.equals(owner.getId())) { // avoid duplicate
                    UserEntity user = userRepository.findById(uuid)
                            .orElseThrow(() -> new RuntimeException("User not found: " + uuid));
                    users.add(user);
                }
            }
        }

        project.setUsers(users);

        // Save Entity
        ProjectEntity savedProject = this.projectRepository.save(project);

        // Convert to ProjectResponseRecord
        return mapToResponse(savedProject);
    }

    public ColumnResponse createNewColumn(ProjectColumnRequest request, String projectId) {
        TaskColumn column = new TaskColumn();

        column.setColor(request.color());
        column.setName(request.name());

        UUID projectUUID = UUID.fromString(projectId);

        ProjectEntity project = this.projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found" + projectId));

        column.setProject(project);

        TaskColumn latestColumn = this.taskColumnRepository.findLatestTaskColumnByProjectId(projectUUID).orElse(null);
        // first column
        if (latestColumn == null) {
            String position = Integer.toString(100000, 36);
            column.setPosition(position);
        } else {
            int latestPosition = Integer.parseInt(latestColumn.getPosition(), 36); // parse latest task position to int
            int newestPosition = latestPosition + 100000;

            String newposition = Integer.toString(newestPosition, 36);
            column.setPosition(newposition);
        }

        TaskColumn createdColumn = this.taskColumnRepository.save(column);

        ColumnResponse response = EntityMapper.mapToColumnResponse(createdColumn);
        EventPayload payload = new EventPayload.ColumnCreatedEvent(response);

        String destination = "/topic/projects/" + projectId;
        System.out.println("SENDING TO " + destination);
        this.mesageTemplate.convertAndSend(destination, payload);

        return EntityMapper.mapToColumnResponse(column);
    }

    public void moveColumn(String columnId, String projectId, ColumnPositionRequest request) {
        UUID projectUUID = EntityMapper.mapToUUID(projectId);
        UUID columnUUID = EntityMapper.mapToUUID(columnId);

        TaskColumn column = this.taskColumnRepository.findById(
                columnUUID)
                .orElseThrow(() -> new RuntimeException("Task not found " + columnId));

        if (!column.getProject().getId().equals(projectUUID)) {
            throw new RuntimeException("This task does not belong to this project: " + projectId);
        }

        UUID prevColumnUUID = EntityMapper.mapToUUID(request.prevColumnId());
        UUID nextColumnUUID = EntityMapper.mapToUUID(request.nextColumnId());

        TaskColumn prevTask = null;
        TaskColumn nextColumn = null;

        // If it not null then it should've exists
        if (prevColumnUUID != null) {
            prevTask = this.taskColumnRepository.findById(prevColumnUUID)
                    .orElseThrow(() -> new RuntimeException("This prev task should exists: " + request.prevColumnId()));
        }

        if (nextColumnUUID != null) {
            nextColumn = this.taskColumnRepository.findById(nextColumnUUID)
                    .orElseThrow(() -> new RuntimeException("This next task should exists: " + request.nextColumnId()));
        }

        System.out.println("prev column ORDER: " + request.prevColumnId());
        System.out.println("next column ORDER: " + request.nextColumnId());

        int newOrderInt;
        if (prevTask == null && nextColumn == null) {
            // Case 1: Column is empty;
            newOrderInt = 100000;
        } else if (prevTask == null) {
            // Case 2: Dropped at the very top
            int nextOrder = Integer.parseInt(nextColumn.getPosition(), 36);
            newOrderInt = nextOrder / 2;
        } else if (nextColumn == null) {
            // Case 3: Dropped at the very bottom
            int prevOrder = Integer.parseInt(prevTask.getPosition(), 36);
            newOrderInt = prevOrder + 100000;
        } else {
            // Case 4: Dropped in between
            int prevOrder = Integer.parseInt(prevTask.getPosition(), 36);
            int nextOrder = Integer.parseInt(nextColumn.getPosition(), 36);
            newOrderInt = (prevOrder + nextOrder) / 2;
        }

        System.out.println("NEW ORDER: " + newOrderInt);
        String newOrder = Integer.toString(newOrderInt, 36);
        column.setPosition(newOrder);

        this.taskColumnRepository.save(column);

        // broad cast the event
        EventPayload payload = new EventPayload.ColumnMovedEvent(columnId, newOrder);
        String destination = "/topic/projects/" + projectId;

        this.mesageTemplate.convertAndSend(destination, payload);
    }

    public void deleteColumn(UUID columnId) {
        this.taskColumnRepository.deleteById(columnId);
    }

    public String deleteProject(UUID projectId) {
        this.projectRepository.deleteById(projectId);

        return "Deleted " + projectId.toString();
    }

    private ProjectResponseRecord mapToResponse(ProjectEntity entity) {
        List<UUID> userIds = entity.getUsers() != null
                ? entity.getUsers().stream().map(UserEntity::getId).toList()
                : List.of();
        UUID ownerId = entity.getOwner() != null ? entity.getOwner().getId() : null;
        return new ProjectResponseRecord(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                ownerId,
                userIds,
                entity.getCreatedDate(),
                entity.getLastEdited());
    }

    public ProjectBoardResponse getProjectBoard(UUID projectId) {
        ProjectEntity project = this.projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        ProjectBoardResponse payload = EntityMapper.mapToProjectBoardResponse(project);
        return payload;
    }

    public ProjectSummary constructTaskCreationBlueprint(String projectId) {
        UUID projectUUID = UUID.fromString(projectId);

        ProjectEntity project = this.projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        List<ColumnSummary> columnOptions = project.getColumns() != null
                ? project.getColumns().stream()
                        .map(col -> new ColumnSummary(col.getId().toString(), col.getName(), col.getColor()))
                        .toList()
                : List.of();

        List<TagSummary> tagOptions = this.tagRepository.findByProjectId(projectUUID).stream()
                .map(tag -> new TagSummary(tag.getId().toString(), tag.getName(), tag.getColor()))
                .toList();

        List<PrioritySummary> priorityOptions = java.util.Arrays.stream(Priority.values())
                .map(p -> new PrioritySummary(p.name()))
                .toList();

        return new ProjectSummary(
                "Task Title Example",
                "A detailed description of the task requirements and steps.",
                tagOptions,
                columnOptions,
                priorityOptions,
                java.time.Instant.now().toString());
    }
}
