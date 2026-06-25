package helper.project.planner_helper.DTO;

public record AddUserToGroupRequest(
    String userId,
    String inviteCode
) {}
