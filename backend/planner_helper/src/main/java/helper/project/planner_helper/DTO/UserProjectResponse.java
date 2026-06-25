package helper.project.planner_helper.DTO;

import java.util.UUID;

import helper.project.planner_helper.Database.ProjectEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserProjectResponse(
        UUID id,
        String title,
        String description,
        UUID ownerId,
        UUID groupId) {

    public UserProjectResponse(ProjectResponseRecord record) {
        this(record.id(), record.title(), record.description(), record.ownerId(), record.groupId());
    }

    public UserProjectResponse(ProjectEntity entity) {
        this(entity.getId(), entity.getTitle(), entity.getDescription(), entity.getOwner().getId(),
             entity.getGroup() != null ? entity.getGroup().getId() : null);
    }
}
