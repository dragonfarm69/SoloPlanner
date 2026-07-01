package helper.project.planner_helper.Services;

import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import helper.project.planner_helper.AIEvent;
import io.grpc.stub.StreamObserver;

/**
 * Holds the single live gRPC stream to the AI microservice and allows any
 * component to publish an {@link AIEvent} onto it.
 *
 * <p>The stream observer is registered when the AI microservice calls
 * {@code SubscribeAIEvents} and is cleared automatically when the client
 * disconnects or an error occurs.
 */
@Service
public class AIChatStreamService {

    private static final Logger log = LoggerFactory.getLogger(AIChatStreamService.class);

    // AtomicReference so we can swap the observer safely without locking every publish call.
    private final AtomicReference<StreamObserver<AIEvent>> observerRef = new AtomicReference<>(null);

    /**
     * Called by {@link helper.project.planner_helper.Handler.ProjectGrpcHandler}
     * when the AI microservice opens the subscription stream.
     */
    public void registerObserver(StreamObserver<AIEvent> observer) {
        StreamObserver<AIEvent> previous = observerRef.getAndSet(observer);
        if (previous != null) {
            // Close the old stream cleanly before replacing it (reconnect scenario).
            try {
                previous.onCompleted();
            } catch (Exception ignored) {
                // The old stream may already be dead; ignore.
            }
        }
        log.info("AI microservice stream registered");
    }

    /** Clears the observer reference when the client disconnects or errors. */
    public void clearObserver() {
        observerRef.set(null);
        log.info("AI microservice stream cleared");
    }

    /**
     * Publishes one AI chat event to the AI microservice.
     *
     * @param projectId the project that the message belongs to
     * @param userId    Keycloak subject of the user who sent the message
     * @param content   the raw message text
     * @return {@code true} if the event was delivered, {@code false} if no client is connected
     */
    public boolean publish(String projectId, String userId, String content) {
        StreamObserver<AIEvent> observer = observerRef.get();
        if (observer == null) {
            log.warn("AI event dropped — no AI microservice connected (project={}, user={})", projectId, userId);
            return false;
        }
        try {
            AIEvent event = AIEvent.newBuilder()
                    .setProjectId(projectId)
                    .setUserId(userId)
                    .setContent(content)
                    .build();
            observer.onNext(event);
            log.debug("AI event published: project={}, user={}", projectId, userId);
            return true;
        } catch (Exception e) {
            log.error("Failed to publish AI event, clearing dead stream", e);
            clearObserver();
            return false;
        }
    }
}
