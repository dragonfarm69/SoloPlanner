package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.ProjectRequestRecord;
import helper.project.planner_helper.DTO.ProjectResponseRecord;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository; // final to make sure it is immutable

    // constructor
    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<ProjectEntity> getProjects(UUID userId) {
        return this.projectRepository.findProjectByUserId(userId);
    }

    public ProjectResponseRecord createProject(ProjectRequestRecord request) {
        ProjectEntity project = new ProjectEntity();

        project.setTitle(request.title());
        project.setDescription(request.description());

        if (request.ownerId() != null) {
            UserEntity owner = new UserEntity();
            owner.setId(request.ownerId());
            project.setOwner(owner);
        }
        if (request.userIds() != null) {
            List<UserEntity> users = request.userIds().stream()
                    .map(uuid -> {
                        UserEntity user = new UserEntity();
                        user.setId(uuid);
                        return user;
                    })
                    .toList();
            project.setUsers(users);
        }

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
