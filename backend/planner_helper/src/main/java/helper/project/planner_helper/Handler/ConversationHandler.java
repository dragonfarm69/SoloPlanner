package helper.project.planner_helper.Handler;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import helper.project.planner_helper.DTO.ConversationRequest;
import helper.project.planner_helper.DTO.ConversationResponse;
import helper.project.planner_helper.DTO.MessageRequest;
import helper.project.planner_helper.DTO.MessageResponse;
import helper.project.planner_helper.Services.ConversationService;

@RestController
@RequestMapping("/projects/{project_id}/conversations")
public class ConversationHandler {
    private final ConversationService conversationService;

    public ConversationHandler(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    // ── Conversation endpoints ───────────────────────────────────────────

    @GetMapping
    public List<ConversationResponse> getUserConversations(
            @PathVariable("project_id") UUID projectId,
            @RequestParam("userId") UUID userId) {
        return conversationService.getUserConversations(projectId, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse createConversation(
            @PathVariable("project_id") UUID projectId,
            @Validated @RequestBody ConversationRequest request) {
        return conversationService.createConversation(projectId, request);
    }

    @GetMapping("/{conversation_id}")
    public ConversationResponse getConversation(
            @PathVariable("project_id") UUID projectId,
            @PathVariable("conversation_id") UUID conversationId,
            @RequestParam("userId") UUID userId) {
        return conversationService.getConversation(conversationId, userId);
    }

    @DeleteMapping("/{conversation_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteConversation(
            @PathVariable("project_id") UUID projectId,
            @PathVariable("conversation_id") UUID conversationId,
            @RequestParam("userId") UUID userId) {
        conversationService.deleteConversation(conversationId, userId);
    }

    // ── Message endpoints ────────────────────────────────────────────────

    @GetMapping("/{conversation_id}/messages")
    public List<MessageResponse> getMessages(
            @PathVariable("project_id") UUID projectId,
            @PathVariable("conversation_id") UUID conversationId,
            @RequestParam("userId") UUID userId) {
        return conversationService.getMessages(conversationId, userId);
    }

    @PostMapping("/{conversation_id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse addMessage(
            @PathVariable("project_id") UUID projectId,
            @PathVariable("conversation_id") UUID conversationId,
            @RequestParam("userId") UUID userId,
            @Validated @RequestBody MessageRequest request) {
        return conversationService.addMessage(conversationId, userId, request);
    }
}
