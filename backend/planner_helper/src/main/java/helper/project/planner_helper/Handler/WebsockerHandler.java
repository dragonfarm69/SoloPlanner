package helper.project.planner_helper.Handler;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import helper.project.planner_helper.DTO.Events.EventPayload;
import helper.project.planner_helper.Services.AIChatStreamService;

@Controller
public class WebsockerHandler {
    private final AIChatStreamService aiChatStreamService;

    public WebsockerHandler(AIChatStreamService aiChatStreamService) {
        this.aiChatStreamService = aiChatStreamService;
    }

    @MessageMapping("/project/{projectId}/events")
    public void handleProjectEvent(
            @DestinationVariable String projectId,
            @Payload EventPayload event) {

        switch (event) {
            case EventPayload.ChatMessage e -> handleChatMessage(projectId, e);
            case EventPayload.AIMessage e -> handleAIMessage(projectId, e);
            default -> throw new IllegalArgumentException("Unknown event type: " + event);
        }
    }

    private void handleChatMessage(String projectId, EventPayload.ChatMessage event) {
        // Handle regular chat message (broadcast, persist, etc.) — future work
    }

    private void handleAIMessage(String projectId, EventPayload.AIMessage event) {
        // Extract the authenticated user's ID from the security context.
        // Keycloak populates this via the HandShakeInterceptor → session attributes.
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = (auth != null) ? auth.getName() : "unknown";

        aiChatStreamService.publish(projectId, userId, event.content());
    }
}
