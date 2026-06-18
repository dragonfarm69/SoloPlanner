package helper.project.planner_helper.DTO;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ConversationRequest(
                String title,
                UUID userId) {
}
