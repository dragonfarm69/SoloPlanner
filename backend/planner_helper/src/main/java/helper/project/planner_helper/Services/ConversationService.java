package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.ConversationRequest;
import helper.project.planner_helper.DTO.ConversationResponse;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.MessageRequest;
import helper.project.planner_helper.DTO.MessageResponse;
import helper.project.planner_helper.Database.ConversationEntity;
import helper.project.planner_helper.Database.MessageEntity;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ConversationRepository;
import helper.project.planner_helper.Repository.MessageRepository;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.UserRepository;
import helper.project.planner_helper.Types.MessageRole;

@Service
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ConversationService(ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    // ── Conversation operations ──────────────────────────────────────────

    public List<ConversationResponse> getUserConversations(UUID projectId, UUID userId) {
        List<ConversationEntity> conversations = conversationRepository
                .findByProjectIdAndUserId(projectId, userId);

        return conversations.stream()
                .map(EntityMapper::mapToConversationResponse)
                .toList();
    }

    public ConversationResponse getConversation(UUID conversationId, UUID userId) {
        ConversationEntity conversation = findOwnedConversation(conversationId, userId);
        return EntityMapper.mapToConversationResponse(conversation);
    }

    public ConversationResponse createConversation(UUID projectId, ConversationRequest request) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        UserEntity user = userRepository.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.userId()));

        ConversationEntity conversation = new ConversationEntity();
        conversation.setTitle(request.title());
        conversation.setProject(project);
        conversation.setUser(user);

        ConversationEntity saved = conversationRepository.save(conversation);
        return EntityMapper.mapToConversationResponse(saved);
    }

    public void deleteConversation(UUID conversationId, UUID userId) {
        ConversationEntity conversation = findOwnedConversation(conversationId, userId);
        conversationRepository.delete(conversation);
    }

    // ── Message operations ───────────────────────────────────────────────

    public List<MessageResponse> getMessages(UUID conversationId, UUID userId) {
        // Verify ownership before loading messages
        findOwnedConversation(conversationId, userId);

        List<MessageEntity> messages = messageRepository
                .findByConversationIdOrdered(conversationId);

        return messages.stream()
                .map(EntityMapper::mapToMessageResponse)
                .toList();
    }

    public MessageResponse addMessage(UUID conversationId, UUID userId, MessageRequest request) {
        ConversationEntity conversation = findOwnedConversation(conversationId, userId);

        MessageEntity message = new MessageEntity();
        message.setContent(request.content());
        message.setRole(MessageRole.valueOf(request.role()));
        message.setConversation(conversation);

        MessageEntity saved = messageRepository.save(message);
        return EntityMapper.mapToMessageResponse(saved);
    }

    // ── Private helpers ──────────────────────────────────────────────────

    /**
     * Finds a conversation by ID, but only if the given user owns it.
     * Throws RuntimeException if not found or not owned by the user.
     */
    private ConversationEntity findOwnedConversation(UUID conversationId, UUID userId) {
        return conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException(
                        "Conversation not found or access denied: " + conversationId));
    }
}
