package helper.project.planner_helper.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.webmvc.autoconfigure.WebMvcProperties.Apiversion.Use;
import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.ProjectRequestRecord;
import helper.project.planner_helper.DTO.ProjectResponseRecord;
import helper.project.planner_helper.DTO.UserProjectResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.UserRepository;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository; // final to make sure it is immutable
    private final UserRepository userRepository;

    // constructor
    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
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
}
