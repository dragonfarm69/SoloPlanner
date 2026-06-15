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
})
public sealed interface EventPayload
        permits EventPayload.TaskCreatedEvent, EventPayload.TaskMovedEvent, EventPayload.TaskDeletedEvent,
        EventPayload.ColumnCreatedEvent, EventPayload.ColumnMovedEvent, EventPayload.ColumnDeletedEvent {

    // TASK
    record TaskCreatedEvent(TaskResponse task) implements EventPayload {
    }

    record TaskMovedEvent(String id, String columnId, String newOrder) implements EventPayload {

    }

    record TaskDeletedEvent(String id) implements EventPayload {

    }

    // COLUMN

    record ColumnCreatedEvent(ColumnResponse column) implements EventPayload {
    }

    record ColumnMovedEvent(String id, String newPosition) implements EventPayload {

    }

    record ColumnDeletedEvent(String id) implements EventPayload {

    }
}
