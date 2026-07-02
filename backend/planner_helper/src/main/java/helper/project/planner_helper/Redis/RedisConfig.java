package helper.project.planner_helper.Redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    private static final String PROJECT_CHANNEL_PATTERN = "project:*";
    private static final String CHAT_CHANNEL_PATTERN = "chat:*";

    // serialize payload to plain UTF-8 Strings
    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();

        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());

        return template;
    }

    // subscribe to channel based on pattern
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory factory,
            RedisProjectMessageListener projectListener, RedisChatListener chatListener) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);

        container.addMessageListener(projectListener, new PatternTopic(PROJECT_CHANNEL_PATTERN));
        container.addMessageListener(chatListener, new PatternTopic(CHAT_CHANNEL_PATTERN));
        return container;
    }
}
