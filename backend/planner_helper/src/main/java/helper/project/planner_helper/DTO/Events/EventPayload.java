package helper.project.planner_helper.DTO.Events;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
                // TASK
                @JsonSubTypes.Type(value = EventPayload.TaskCreatedEvent.class, name = "TASK_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.TaskMovedEvent.class, name = "TASK_MOVED"),
                @JsonSubTypes.Type(value = EventPayload.TaskDeletedEvent.class, name = "TASK_DELETED"),
                @JsonSubTypes.Type(value = EventPayload.TaskEditedEvent.class, name = "TASK_EDITED"),
                // COLUMN
                @JsonSubTypes.Type(value = EventPayload.ColumnCreatedEvent.class, name = "COLUMN_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.ColumnMovedEvent.class, name = "COLUMN_MOVED"),
                @JsonSubTypes.Type(value = EventPayload.ColumnDeletedEvent.class, name = "COLUMN_DELETED"),
                // TAG
                @JsonSubTypes.Type(value = EventPayload.ColumnCreatedEvent.class, name = "TAG_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.ColumnDeletedEvent.class, name = "TAG_ADDED"),

                // AI CHAT
                @JsonSubTypes.Type(value = EventPayload.AIMessage.class, name = "AI_CHAT"),

                // CHAT
                @JsonSubTypes.Type(value = EventPayload.ChatMessage.class, name = "CHAT_ROOM_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.ChatMessage.class, name = "CHAT_ROOM"),

                // PUB/SUB CONTROL
                @JsonSubTypes.Type(value = EventPayload.SubscribeEvent.class, name = "SUBSCRIBE"),
                @JsonSubTypes.Type(value = EventPayload.UnsubscribeEvent.class, name = "UNSUBSCRIBE"),
})
public sealed interface EventPayload
                permits EventPayload.TaskCreatedEvent, EventPayload.TaskEditedEvent, EventPayload.TaskMovedEvent,
                EventPayload.TaskDeletedEvent,
                EventPayload.ColumnCreatedEvent, EventPayload.ColumnMovedEvent, EventPayload.ColumnDeletedEvent,
                EventPayload.TagAddedEvent, EventPayload.TagCreatedEvent, EventPayload.AIMessage,
                EventPayload.ChatMessage, EventPayload.ChatRoomCreated,
                EventPayload.SubscribeEvent, EventPayload.UnsubscribeEvent {

        // PUB/SUB CONTROL
        record SubscribeEvent(String topic) implements EventPayload {
        }

        record UnsubscribeEvent(String topic) implements EventPayload {
        }

        // TASK
        record TaskCreatedEvent(TaskSummaryResponse task) implements EventPayload {
        }

        record TaskEditedEvent(TaskSummaryResponse task) implements EventPayload {
        }

        record TaskMovedEvent(String taskId, String columnId, String newOrder) implements EventPayload {

        }

        record TaskDeletedEvent(String taskId) implements EventPayload {

        }

        // COLUMN

        record ColumnCreatedEvent(ColumnResponse column) implements EventPayload {
        }

        record ColumnMovedEvent(String columnId, String newOrder) implements EventPayload {

        }

        record ColumnDeletedEvent(String columnId) implements EventPayload {

        }

        // TAG

        record TagCreatedEvent(TagResponse column) implements EventPayload {
        }

        record TagAddedEvent(String tagId, String taskId) implements EventPayload {

        }

        record AIMessage(String projectId, String userId, String content) implements EventPayload {

        }

        record ChatRoomCreated(String content) implements EventPayload {

        }

        record ChatMessage(String content) implements EventPayload {

        }
}
