package helper.project.planner_helper.DTO;

import java.util.List;

public record GroupResponse(
    String id,
    String name,
    String inviteCode,
    List<UserResponse> users,
    List<ProjectResponseRecord> projects
) {}
