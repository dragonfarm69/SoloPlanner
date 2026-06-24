package helper.project.planner_helper.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import helper.project.planner_helper.Types.Category;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectColumnRequest(String name, String color, Category category) {
    public ProjectColumnRequest() {
        this("", "#444", Category.TODO);
    }

    public ProjectColumnRequest {
        if (color == null) {
            color = "#444";
        }
    }
}
