package helper.project.planner_helper.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.Events.TagRequest;
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

    public TagResponse createTag(TagRequest request, String projectId) {
        UUID projectUUID = UUID.fromString(projectId);
        TagEntity tag = new TagEntity();
        tag.setName(request.name());
        tag.setColor(request.color());

        ProjectEntity projectEntity = this.projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found " + projectId));
        tag.setProject(projectEntity);

        TagEntity createdTag = tagRepository.save(tag);
        TagResponse response = EntityMapper.mapToTagResponses(createdTag);

        return response;
    }

    public void deleteTag(String tagId) {
        UUID tagUUID = UUID.fromString(tagId);
        tagRepository.deleteById(tagUUID);
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
