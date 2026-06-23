package helper.project.planner_helper.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectColumnRequest(String name, String color) {
    public ProjectColumnRequest() {
        this("", "#444");
    }

    public ProjectColumnRequest {
        if (color == null) {
            color = "#444";
        }
    }
}
