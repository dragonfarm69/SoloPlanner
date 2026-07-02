package helper.project.planner_helper.Redis;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.stereotype.Component;

import helper.project.planner_helper.Handler.ProjectWebSocketHandler;

@Component
public class RedisProjectMessageListener implements MessageListener {
    private final ProjectWebSocketHandler handler;
    private final StringRedisSerializer serializer = new StringRedisSerializer();

    public RedisProjectMessageListener(ProjectWebSocketHandler handler) {
        this.handler = handler;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = serializer.deserialize(message.getChannel());
        String body = serializer.deserialize(message.getBody());

        handler.onRedisMessage(body, channel);
    }
}
