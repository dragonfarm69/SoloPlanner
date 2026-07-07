package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.UserStoryRequest;
import helper.project.planner_helper.DTO.UserStoryResponse;
import helper.project.planner_helper.DTO.UserStoryDetailsResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserStoryEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.UserStoryRepository;

@Service
@Transactional
public class UserStoryService {
    private final UserStoryRepository userStoryRepository;
    private final ProjectRepository projectRepository;

    public UserStoryService(UserStoryRepository userStoryRepository, ProjectRepository projectRepository) {
        this.userStoryRepository = userStoryRepository;
        this.projectRepository = projectRepository;
    }

    public List<UserStoryResponse> getUserStories(String projectId) {
        UUID projectUUID = UUID.fromString(projectId);
        List<UserStoryEntity> stories = userStoryRepository.findActiveByProjectId(projectUUID);
        return stories.stream()
                .map(EntityMapper::mapToUserStoryResponse)
                .collect(Collectors.toList());
    }

    public UserStoryResponse createUserStory(String projectId, UserStoryRequest request) {
        UUID projectUUID = UUID.fromString(projectId);
        ProjectEntity project = projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        UserStoryEntity story = new UserStoryEntity();
        story.setProject(project);
        story.setTitle(request.title());
        story.setRoleContext(request.roleContext());
        story.setWantContext(request.wantContext());
        story.setBenefitContext(request.benefitContext());
        story.setDescription(request.description());
        if (request.priority() != null) {
            story.setPriority(request.priority());
        }
        if (request.status() != null) {
            story.setStatus(request.status());
        }
        story.setStoryPoints(request.storyPoints());

        if (request.parentId() != null && !request.parentId().trim().isEmpty()) {
            UserStoryEntity parent = userStoryRepository.findById(UUID.fromString(request.parentId()))
                    .orElseThrow(() -> new RuntimeException("Parent story not found: " + request.parentId()));
            story.setParent(parent);
        }

        UserStoryEntity saved = userStoryRepository.save(story);
        return EntityMapper.mapToUserStoryResponse(saved);
    }

    public UserStoryResponse updateUserStory(String storyId, UserStoryRequest request) {
        UUID storyUUID = UUID.fromString(storyId);
        UserStoryEntity story = userStoryRepository.findById(storyUUID)
                .orElseThrow(() -> new RuntimeException("User story not found: " + storyId));

        if (request.title() != null) {
            story.setTitle(request.title());
        }
        if (request.roleContext() != null) {
            story.setRoleContext(request.roleContext());
        }
        if (request.wantContext() != null) {
            story.setWantContext(request.wantContext());
        }
        if (request.benefitContext() != null) {
            story.setBenefitContext(request.benefitContext());
        }
        if (request.description() != null) {
            story.setDescription(request.description());
        }
        if (request.priority() != null) {
            story.setPriority(request.priority());
        }
        if (request.status() != null) {
            story.setStatus(request.status());
            if ("archived".equalsIgnoreCase(request.status())) {
                story.setArchived(true);
            } else {
                story.setArchived(false);
            }
        }
        story.setStoryPoints(request.storyPoints()); // can be set to null

        if (request.parentId() != null && !request.parentId().trim().isEmpty()) {
            UserStoryEntity parent = userStoryRepository.findById(UUID.fromString(request.parentId()))
                    .orElseThrow(() -> new RuntimeException("Parent story not found: " + request.parentId()));
            story.setParent(parent);
        } else {
            story.setParent(null);
        }

        UserStoryEntity saved = userStoryRepository.save(story);
        return EntityMapper.mapToUserStoryResponse(saved);
    }

    public void deleteUserStory(String storyId) {
        UUID storyUUID = UUID.fromString(storyId);
        userStoryRepository.deleteById(storyUUID);
    }

    public UserStoryDetailsResponse getStoryDetails(String storyId, String projectId) {
        UUID storyUUID = UUID.fromString(storyId);
        UUID projectUUID = UUID.fromString(projectId);

        projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        UserStoryEntity story = userStoryRepository.findById(storyUUID)
                .orElseThrow(() -> new RuntimeException("User story not found: " + storyId));
        return EntityMapper.mapToUserStoryDetailsResponse(story);
    }
}
