package helper.project.planner_helper.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserResponse(String username,
                String firstName,
                String lastName,
                String email,
                String id) {
}
