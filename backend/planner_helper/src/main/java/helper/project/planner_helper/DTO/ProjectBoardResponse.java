package helper.project.planner_helper.DTO;

import java.util.List;

public record ProjectBoardResponse(String title, List<ColumnResponse> columns) {

}
