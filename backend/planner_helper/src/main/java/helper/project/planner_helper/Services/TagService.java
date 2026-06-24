package helper.project.planner_helper.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.Events.TagResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TagEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.TagRepository;

@Service
public class TagService {
    private final TagRepository tagRepository;
    private final ProjectRepository projectRepository;

    public TagService(TagRepository tagRepository, ProjectRepository projectRepository) {
        this.tagRepository = tagRepository;
        this.projectRepository = projectRepository;
    }

    public void createTag(String projectId) {
        UUID projectUUID = UUID.fromString(projectId);
        TagEntity tag = new TagEntity();

        ProjectEntity projectEntity = this.projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found " + projectId));
        tag.setProject(projectEntity);

        tagRepository.save(tag);
    }

    public List<TagResponse> getTags(String projectId) {
        UUID projectUUID = UUID.fromString(projectId);
        List<TagEntity> tags = this.tagRepository.findByProjectId(projectUUID);
        List<TagResponse> tagResponses = new ArrayList<>();

        for (TagEntity tag : tags) {
            TagResponse tagResponse = EntityMapper.mapToTagResponses(tag);
            tagResponses.add(tagResponse);
        }
        return tagResponses;
    }
}
