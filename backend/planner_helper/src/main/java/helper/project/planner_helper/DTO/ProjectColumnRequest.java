package helper.project.planner_helper.DTO;

public record ProjectColumnRequest(String name, String color, int position) {
    public ProjectColumnRequest() {
        this("", "#444", 0);
    }

    public ProjectColumnRequest {
        if (color == null) {
            color = "#444";
        }
    }
}
