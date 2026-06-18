package helper.project.planner_helper.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MessageRequest(
                String content,
                String role) {
}
