package helper.project.planner_helper.Handler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import helper.project.planner_helper.DTO.ProjectColumnRequest;
import helper.project.planner_helper.DTO.Blueprint.TaskCreationBlueprint;
import helper.project.planner_helper.Services.ProjectService;

@RestController
@RequestMapping("/helper")
public class AIHandler {
    final private ProjectService projectService;

    public AIHandler(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/task/blueprint/{projectId}")
    public TaskCreationBlueprint GetTaskCreationBlueprint(@PathVariable("projectId") String projectId) {
        return this.projectService.constructTaskCreationBlueprint(projectId);
    }

    @GetMapping("/column/blueprint")
    public ProjectColumnRequest GetColumnCreationBlueprint() {
        return new ProjectColumnRequest();
    }
}
