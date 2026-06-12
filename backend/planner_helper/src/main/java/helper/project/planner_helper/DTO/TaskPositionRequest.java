package helper.project.planner_helper.DTO;

public record TaskPositionRequest(
                String columnId,
                String prevTaskId,
                String nextTaskId) {

}
