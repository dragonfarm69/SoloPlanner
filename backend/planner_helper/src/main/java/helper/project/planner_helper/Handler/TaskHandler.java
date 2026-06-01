package helper.project.planner_helper.Handler;

import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import helper.project.planner_helper.Services.TaskService;

@RestController
@RequestMapping("/task")
public class TaskHandler {
    @GetMapping
    public String getTaskInformation() {
        return "Task info";
    }

    @PostMapping
    public String createTask() {
        // do something
        return "task_id";
    }

    @DeleteMapping
    public String deleteTask() {
        // do something
        return "deleted_id";
    }

    @GetMapping("/{task_id}/tags")
    public List<String> getTaskTags(@PathVariable Long task_id) {
        return Arrays.asList("tag1", "tag2");
    }

    @PostMapping("/{task_id}/{tag_id}}")
    public String addTagToTask(@PathVariable Long task_id, @PathVariable Long tag_id) {
        return "added task";
    }

    @DeleteMapping("/{task_id}/{tag_id}")
    public String removeTag(@PathVariable Long task_id, @PathVariable Long tag_id) {
        return "removed task";
    }
}
