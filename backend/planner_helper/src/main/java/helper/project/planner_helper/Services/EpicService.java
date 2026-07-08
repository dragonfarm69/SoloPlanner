package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import helper.project.planner_helper.DTO.EpicRequest;
import helper.project.planner_helper.DTO.EpicResponse;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.Database.EpicEntity;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.EpicRepository;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.UserRepository;

@Service
@Transactional
public class EpicService {

    private final EpicRepository epicRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public EpicService(EpicRepository epicRepository, ProjectRepository projectRepository,
            UserRepository userRepository) {
        this.epicRepository = epicRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public List<EpicResponse> getEpics(String projectId) {
        UUID projectUUID = UUID.fromString(projectId);
        List<EpicEntity> epics = epicRepository.findActiveByProjectId(projectUUID);
        return epics.stream()
                .map(EntityMapper::mapToEpicResponse)
                .collect(Collectors.toList());
    }

    public EpicResponse getEpicDetails(String epicId, String projectId) {
        UUID projectUUID = UUID.fromString(projectId);
        UUID epicUUID = UUID.fromString(epicId);

        projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        EpicEntity epic = epicRepository.findById(epicUUID)
                .orElseThrow(() -> new RuntimeException("Epic not found: " + epicId));

        return EntityMapper.mapToEpicResponse(epic);
    }

    public EpicResponse createEpic(String projectId, EpicRequest request) {
        UUID projectUUID = UUID.fromString(projectId);
        ProjectEntity project = projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        EpicEntity epic = new EpicEntity();
        epic.setProject(project);
        epic.setTitle(request.title());
        epic.setDescription(request.description());

        if (request.priority() != null) {
            epic.setPriority(request.priority());
        }
        if (request.status() != null) {
            epic.setStatus(request.status());
        }

        resolveAndSetCreator(epic, request.creatorId());

        EpicEntity saved = epicRepository.save(epic);
        return EntityMapper.mapToEpicResponse(saved);
    }

    public EpicResponse updateEpic(String epicId, EpicRequest request) {
        UUID epicUUID = UUID.fromString(epicId);
        EpicEntity epic = epicRepository.findById(epicUUID)
                .orElseThrow(() -> new RuntimeException("Epic not found: " + epicId));

        if (request.title() != null) {
            epic.setTitle(request.title());
        }
        if (request.description() != null) {
            epic.setDescription(request.description());
        }
        if (request.priority() != null) {
            epic.setPriority(request.priority());
        }
        if (request.status() != null) {
            epic.setStatus(request.status());
            epic.setArchived("archived".equalsIgnoreCase(request.status()));
        }

        EpicEntity saved = epicRepository.save(epic);
        return EntityMapper.mapToEpicResponse(saved);
    }

    private void resolveAndSetCreator(EpicEntity epic, String creatorId) {
        if (creatorId == null || creatorId.isBlank()) {
            return;
        }
        UUID creatorUUID = UUID.fromString(creatorId);
        UserEntity creator = userRepository.findById(creatorUUID)
                .orElseThrow(() -> new RuntimeException("Creator user not found: " + creatorId));
        epic.setCreator(creator);
    }
}
