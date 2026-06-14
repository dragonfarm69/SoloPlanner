package helper.project.planner_helper;

import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import helper.HandShakeInterceptor;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.UserResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.UserRepository;
import helper.project.planner_helper.Services.ProjectService;
import helper.project.planner_helper.Services.UserService;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final ProjectService projectService;
    private final UserService userService;

    public WebSocketConfig(UserService userService,
            ProjectService projectService) {
        this.userService = userService;
        this.projectService = projectService;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel regiChannel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    Map<String, Object> attributes = accessor.getSessionAttributes();
                    String authToken = (attributes != null) ? (String) attributes.get("authToken") : null;

                    if (authToken == null) {
                        throw new RuntimeException("No token found");
                    }

                    // get id in access_token
                    String[] chunks = authToken.split("\\.");
                    Base64.Decoder decoder = Base64.getUrlDecoder();

                    String payload = new String(decoder.decode(chunks[1]));
                    ObjectMapper mapper = new ObjectMapper();

                    Map<String, Object> payloadMap = mapper.readValue(payload,
                            new TypeReference<Map<String, Object>>() {
                            });
                    String userId = (String) payloadMap.get("sub");

                    UserEntity user = userService.findUser(userId);
                    if (user == null) {
                        throw new RuntimeException("User not found: " + userId);
                    }

                    String destination = accessor.getDestination();
                    if (destination != null && destination.startsWith("/topic/project/")) {
                        String projectId = destination.replace("/topic/project/", "");

                        UUID projectUUID = UUID.fromString(projectId);

                        ProjectEntity project = projectService.findProject(projectUUID);

                        if (project == null) {
                            throw new RuntimeException("This project doesn't exists: " + projectId);
                        }

                        // check if user is in project
                        boolean isUserInProject = projectService.isUserInProject(projectUUID, user.getId());

                        if (!isUserInProject) {
                            throw new RuntimeException("This user " + userId + "is not in the project " + projectId);
                        }
                    }
                }
                return message;
            }
        });
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-connect")
                .addInterceptors(new HandShakeInterceptor()) // register new interceptor
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
