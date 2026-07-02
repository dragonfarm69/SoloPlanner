package helper.project.planner_helper.Handler;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.DTO.Events.EventPayload;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.UserRepository;
import helper.project.planner_helper.Services.AIChatStreamService;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
public class ProjectWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ProjectWebSocketHandler.class);

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AIChatStreamService aiChatStreamService;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, String> redisTemplate;

    // Maps Project ID to the set of active WebSocket sessions subscribed to it
    private final ConcurrentHashMap<UUID, Set<WebSocketSession>> projectSessions = new ConcurrentHashMap<>();

    public ProjectWebSocketHandler(UserRepository userRepository,
            ProjectRepository projectRepository,
            AIChatStreamService aiChatStreamService, RedisTemplate<String, String> redisTemplate) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.aiChatStreamService = aiChatStreamService;
        this.objectMapper = new ObjectMapper();
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID projectId = extractProjectId(session);
        if (projectId == null) {
            log.warn("Connection rejected: Missing or invalid Project ID in URI path");
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if (!authenticateAndAuthorize(session, projectId)) {
            log.warn("Connection rejected: Authentication or authorization failed for session {}", session.getId());
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // Register session for the project
        projectSessions.computeIfAbsent(projectId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.info("WebSocket connection established for session {} on project {}", session.getId(), projectId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID projectId = extractProjectId(session);
        String userId = (String) session.getAttributes().get("userId");

        if (projectId == null || userId == null) {
            log.warn("Ignoring message: Unauthenticated session {}", session.getId());
            return;
        }

        String payloadStr = message.getPayload();
        try {
            EventPayload inboundEvent = objectMapper.readValue(payloadStr, EventPayload.class);
            if (inboundEvent instanceof EventPayload.AIMessage aiMessage) {
                log.debug("Received AI message from user {} on project {}", userId, projectId);
                aiChatStreamService.publish(projectId.toString(), userId, aiMessage.content());
            } else {
                log.warn("Received unsupported inbound event type: {}", inboundEvent.getClass().getSimpleName());
            }
        } catch (Exception e) {
            log.error("Failed to parse inbound text message from session {}", session.getId(), e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UUID projectId = extractProjectId(session);
        if (projectId != null) {
            Set<WebSocketSession> sessions = projectSessions.get(projectId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    projectSessions.remove(projectId);
                }
            }
        }
        log.info("WebSocket connection closed for session {} with status {}", session.getId(), status);
    }

    /**
     * Broadcasts a payload event to all active sessions subscribed to the given
     * project ID.
     */
    public void broadcastToProject(UUID projectId, Object payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            redisTemplate.convertAndSend("project:" + projectId, jsonPayload);
        } catch (Exception e) {
            log.error("Failed to serialize broadcast payload for project {}", projectId, e);
        }
    }

    public void onRedisMessage(String message, String channel) {
        String projectId = channel.substring("project:".length());
        try {
            UUID projectUUID = UUID.fromString(projectId);
            Set<WebSocketSession> sessions = projectSessions.getOrDefault(projectUUID, Collections.emptySet());

            TextMessage textMessage = new TextMessage(message);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        log.error("Failed to send message to session {}", session.getId(), e);
                    }
                }
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid project ID in Redis channel: {}", channel, e);
        }
    }

    /**
     * Extracts the project ID from the request URI path.
     * Expects a path ending with /projects/{projectId}
     */
    private UUID extractProjectId(WebSocketSession session) {
        try {
            String path = session.getUri().getPath();
            String[] segments = path.split("/");
            String lastSegment = segments[segments.length - 1];
            return UUID.fromString(lastSegment);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validates the connection token and checks project membership.
     * Sets parsed userId inside session attributes if valid.
     */
    private boolean authenticateAndAuthorize(WebSocketSession session, UUID projectId) {
        String authToken = (String) session.getAttributes().get("authToken");
        if (authToken == null) {
            log.warn("Auth token missing from session attributes");
            return false;
        }

        try {
            String[] chunks = authToken.split("\\.");
            if (chunks.length < 2) {
                log.warn("Auth token is not in valid JWT format");
                return false;
            }

            Base64.Decoder decoder = Base64.getUrlDecoder();
            String payload = new String(decoder.decode(chunks[1]));

            Map<String, Object> payloadMap = objectMapper.readValue(payload, new TypeReference<Map<String, Object>>() {
            });
            String userId = (String) payloadMap.get("sub");
            if (userId == null) {
                log.warn("Subject claim missing from JWT token");
                return false;
            }

            UserEntity user = userRepository.findUserByUserId(userId);
            if (user == null) {
                log.warn("User not found in database: {}", userId);
                return false;
            }

            ProjectEntity project = projectRepository.findById(projectId).orElse(null);
            if (project == null) {
                log.warn("Project does not exist: {}", projectId);
                return false;
            }

            boolean isUserInProject = projectRepository.findUserInProject(user.getId(), projectId).isPresent();
            if (!isUserInProject) {
                log.warn("User {} is not authorized for project {}", userId, projectId);
                return false;
            }

            // Save user info in the session attributes for subsequent message processing
            session.getAttributes().put("userId", userId);
            return true;
        } catch (Exception e) {
            log.error("Error during authentication/authorization of WebSocket session", e);
            return false;
        }
    }
}
