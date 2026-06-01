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
@RequestMapping("/projects")
public class ProjectHandler {
    private final TaskService taskService;

    public ProjectHandler(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public String getAllProjects() {
        return "project alls";
    }

    @GetMapping("/{project_id}")
    public String getProjectInformation(@PathVariable Long projectId) {
        return "project info " + projectId;
    }

    @GetMapping("/{project_id}/tasks")
    public List<String> getAllTasks(@PathVariable Long projectId) {
        return Arrays.asList("test", "test2");
    }

    @PostMapping
    public String createNewProject() {
        // do something
        return "project id";
    }

    @DeleteMapping
    public String deleteProject() {
        // do something
        return "deleted project";
    }
}
