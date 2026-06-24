package helper.project.planner_helper.Handler;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import helper.project.planner_helper.DTO.ColumnPositionRequest;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.ProjectBoardResponse;
import helper.project.planner_helper.DTO.ProjectColumnRequest;
import helper.project.planner_helper.DTO.ProjectRequestRecord;
import helper.project.planner_helper.DTO.ProjectResponseRecord;
import helper.project.planner_helper.DTO.ProjectTaskRequest;
import helper.project.planner_helper.DTO.TaskEditRequest;
import helper.project.planner_helper.DTO.TaskPositionRequest;
import helper.project.planner_helper.DTO.UserProjectResponse;
import helper.project.planner_helper.DTO.Events.ColumnResponse;
import helper.project.planner_helper.DTO.Events.TaskResponse;
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
    public List<UserProjectResponse> getProjects(@RequestParam("userId") UUID userId) {
        return projectService.getUserProjects(userId);
    }

    @GetMapping("/{project_id}")
    public String getProjectInformation(@PathVariable("project_id") UUID projectId) {
        return "project info " + projectId;
    }

    // get summary data of all the tasks and columns for display
    @GetMapping("/{project_id}/board")
    public ProjectBoardResponse getProjectBoard(@PathVariable("project_id") UUID projectId) {
        return this.projectService.getProjectBoard(projectId);
    }

    @PostMapping("/{project_id}/columns")
    public ColumnResponse addColumn(@Validated @RequestBody ProjectColumnRequest request,
            @PathVariable("project_id") String projectId) {
        return projectService.createNewColumn(request, projectId);
    }

    @DeleteMapping("/{project_id}/{column_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteColumn(@PathVariable("project_id") String projectId, @PathVariable("column_id") String columnId) {
        UUID columnUUID = UUID.fromString(columnId);
        this.projectService.deleteColumn(columnUUID);
    }

    @GetMapping("/{project_id}/{column_id}/{task_id}")
    public List<TaskEntity> getTaskInformation(@PathVariable("project_id") UUID projectId,
            @PathVariable("column_id") String columnId, @PathVariable("task_id") String taskId) {
        return null;
    }

    @PostMapping("/{project_id}/{column_id}/tasks")
    public TaskResponse addTask(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @Validated @RequestBody ProjectTaskRequest request) {
        TaskEntity task = this.taskService.createTask(request, projectId, columnId);
        return EntityMapper.mapToTaskResponse(task);
    }

    @GetMapping("/{project_id}/tags")
    public TaskResponse getTag(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @Validated @RequestBody ProjectTaskRequest request) {
        TaskEntity task = this.taskService.createTask(request, projectId, columnId);
        return EntityMapper.mapToTaskResponse(task);
    }

    @PostMapping("/{project_id}/tags")
    public TaskResponse addTag(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @Validated @RequestBody ProjectTaskRequest request) {
        TaskEntity task = this.taskService.createTask(request, projectId, columnId);
        return EntityMapper.mapToTaskResponse(task);
    }

    @PostMapping
    public ProjectResponseRecord createNewProject(@Validated @RequestBody ProjectRequestRecord request) {
        return this.projectService.createProject(request);
    }

    @DeleteMapping("/{project_id}/{column_id}/{task_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @PathVariable("task_id") String taskId) {
        this.taskService.deleteTask(taskId, projectId, columnId);
    }

    @PatchMapping("/{project_id}/{column_id}/{task_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void editTask(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @PathVariable("task_id") String taskId,
            @Validated @RequestBody TaskEditRequest request) {
        this.taskService.editTask(taskId, projectId, columnId, request);
    }

    @PatchMapping("/{project_id}/{column_id}/{task_id}/position")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moveTask(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @PathVariable("task_id") String taskId,
            @Validated @RequestBody TaskPositionRequest request) {
        this.taskService.moveTask(taskId, projectId, columnId, request);
    }

    @PatchMapping("/{project_id}/{column_id}/position")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moveTask(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId,
            @Validated @RequestBody ColumnPositionRequest request) {
        this.projectService.moveColumn(columnId, projectId, request);
    }

    @DeleteMapping
    public String deleteProject() {
        // do something
        return "deleted project";
        // this.projectService.seet
    }
}
