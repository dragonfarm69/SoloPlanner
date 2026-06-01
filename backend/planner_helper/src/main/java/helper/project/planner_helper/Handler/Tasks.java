package helper.project.planner_helper.Handler;

import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Tasks {
    @GetMapping("/tasks")
    public List<String> getAllTasks() {
        return Arrays.asList("test", "test2");
    }

    @PostMapping("/tasks")
    public String createTask() {
        // do something
        return "task_id";
    }

    @DeleteMapping("/tasks")
    public String deleteTask() {
        // do something
        return "deleted_id";
    }
}
