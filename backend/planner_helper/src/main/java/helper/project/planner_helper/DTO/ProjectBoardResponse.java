package helper.project.planner_helper.DTO;

import java.util.List;

import helper.project.planner_helper.DTO.Events.ColumnResponse;

public record ProjectBoardResponse(String title, List<ColumnResponse> columns) {

}
