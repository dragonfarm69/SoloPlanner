package helper.project.planner_helper.Handler;

import java.util.List;
import java.util.UUID;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import helper.project.planner_helper.DTO.ProjectRequestRecord;
import helper.project.planner_helper.DTO.ProjectResponseRecord;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Services.ProjectService;
import helper.project.planner_helper.Services.TaskService;

@RestController
@RequestMapping("/projects")
public class ProjectHandler {
    private final TaskService taskService;
    private final ProjectService projectService;

    public ProjectHandler(TaskService taskService, ProjectService projectService) {
        this.taskService = taskService;
        this.projectService = projectService;
    }

    @GetMapping
    public String getAllProjects() {
        return "project alls";
    }

    @GetMapping("/{project_id}")
    public String getProjectInformation(@PathVariable("project_id") UUID projectId) {
        return "project info " + projectId;
    }

    @GetMapping("/{project_id}/tasks")
    public List<TaskEntity> getAllTasks(@PathVariable("project_id") UUID projectId) {
        return this.taskService.getProjectTasks(projectId);
    }

    @PostMapping
    public ProjectResponseRecord createNewProject(@Validated @RequestBody ProjectRequestRecord request) {
        return this.projectService.createProject(request);
    }

    @DeleteMapping
    public String deleteProject() {
        // do something
        return "deleted project";
        // this.projectService.seet
    }
}
