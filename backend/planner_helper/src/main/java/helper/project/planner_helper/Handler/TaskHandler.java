package helper.project.planner_helper.Handler;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
