package helper.project.planner_helper.DTO.Blueprint;

import java.util.Arrays;
import java.util.List;

import helper.project.planner_helper.Types.Priority;

public record TaskCreationBlueprint(String title, String description, List<TagSummary> tagOptions,
        List<ColumnSummary> columnOptions,
        List<PrioritySummary> priorityOptions,
        String currentDateTime) {

    public TaskCreationBlueprint() {
        this(
                "Task Title Example",
                "A detailed description of the task requirements and steps.",
                List.of(),
                List.of(),
                Arrays.stream(Priority.values()).map(p -> new PrioritySummary(p.name())).toList(),
                java.time.Instant.now().toString());
    }
}

