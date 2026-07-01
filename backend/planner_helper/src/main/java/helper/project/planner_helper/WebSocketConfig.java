package helper.project.planner_helper;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import helper.HandShakeInterceptor;
import helper.project.planner_helper.Handler.ProjectWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ProjectWebSocketHandler webSocketHandler;

    public WebSocketConfig(ProjectWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/ws-connect/projects/{projectId}")
                .addInterceptors(new HandShakeInterceptor())
                .setAllowedOriginPatterns("*");
    }
}

