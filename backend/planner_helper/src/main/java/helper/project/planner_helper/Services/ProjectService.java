package helper.project.planner_helper.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.webmvc.autoconfigure.WebMvcProperties.Apiversion.Use;
import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.ColumnResponse;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.ProjectBoardResponse;
import helper.project.planner_helper.DTO.ProjectColumnRequest;
import helper.project.planner_helper.DTO.ProjectRequestRecord;
import helper.project.planner_helper.DTO.ProjectResponseRecord;
import helper.project.planner_helper.DTO.UserProjectResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.TaskColumnRepository;
import helper.project.planner_helper.Repository.UserRepository;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository; // final to make sure it is immutable
    private final UserRepository userRepository;
    private final TaskColumnRepository taskColumnRepository;

    // constructor
    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository,
            TaskColumnRepository taskColumnRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskColumnRepository = taskColumnRepository;
    }

    public List<UserProjectResponse> getProjects(UUID userId) {
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

        this.taskColumnRepository.save(column);
        return EntityMapper.mapToColumnResponse(column);
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
}
