package helper.project.planner_helper.DTO;

import java.util.UUID;

import helper.project.planner_helper.Database.ProjectEntity;

public record UserProjectResponse(
        UUID id,
        String title,
        String description,
        UUID ownerId) {

    public UserProjectResponse(ProjectResponseRecord record) {
        this(record.id(), record.title(), record.description(), record.ownerId());
    }

    public UserProjectResponse(ProjectEntity entity) {
        this(entity.getId(), entity.getTitle(), entity.getDescription(), entity.getOwner().getId());
    }
}
