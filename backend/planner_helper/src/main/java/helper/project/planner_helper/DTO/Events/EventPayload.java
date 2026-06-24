package helper.project.planner_helper.DTO.Events;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
                // TASK
                @JsonSubTypes.Type(value = EventPayload.TaskCreatedEvent.class, name = "TASK_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.TaskMovedEvent.class, name = "TASK_MOVED"),
                @JsonSubTypes.Type(value = EventPayload.TaskDeletedEvent.class, name = "TASK_DELETED"),
                // COLUMN
                @JsonSubTypes.Type(value = EventPayload.ColumnCreatedEvent.class, name = "COLUMN_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.ColumnMovedEvent.class, name = "COLUMN_MOVED"),
                @JsonSubTypes.Type(value = EventPayload.ColumnDeletedEvent.class, name = "COLUMN_DELETED"),
                // TAG
                @JsonSubTypes.Type(value = EventPayload.ColumnCreatedEvent.class, name = "TAG_CREATED"),
                @JsonSubTypes.Type(value = EventPayload.ColumnDeletedEvent.class, name = "TAG_ADDED"),
})
public sealed interface EventPayload
                permits EventPayload.TaskCreatedEvent, EventPayload.TaskMovedEvent, EventPayload.TaskDeletedEvent,
                EventPayload.ColumnCreatedEvent, EventPayload.ColumnMovedEvent, EventPayload.ColumnDeletedEvent,
                EventPayload.TagAddedEvent, EventPayload.TagCreatedEvent {

        // TASK
        record TaskCreatedEvent(TaskResponse task) implements EventPayload {
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
}
