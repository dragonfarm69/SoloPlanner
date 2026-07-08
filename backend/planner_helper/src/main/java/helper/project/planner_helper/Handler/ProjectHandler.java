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
import helper.project.planner_helper.DTO.ProjectUserSummary;
import helper.project.planner_helper.DTO.TaskEditRequest;
import helper.project.planner_helper.DTO.TaskPositionRequest;
import helper.project.planner_helper.DTO.UserProjectResponse;
import helper.project.planner_helper.DTO.Events.ColumnResponse;
import helper.project.planner_helper.DTO.Events.TagRequest;
import helper.project.planner_helper.DTO.Events.TagResponse;
import helper.project.planner_helper.DTO.Events.TaskResponse;
import helper.project.planner_helper.DTO.Events.TaskSummaryResponse;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Services.ProjectService;
import helper.project.planner_helper.Services.TagService;
import helper.project.planner_helper.Services.TaskService;
import helper.project.planner_helper.Services.UserStoryService;
import helper.project.planner_helper.DTO.UserStoryRequest;
import helper.project.planner_helper.DTO.UserStoryResponse;
import helper.project.planner_helper.DTO.UserStoryDetailsResponse;
import helper.project.planner_helper.DTO.EpicRequest;
import helper.project.planner_helper.DTO.EpicResponse;
import helper.project.planner_helper.Services.EpicService;

@RestController
@RequestMapping("/projects")
public class ProjectHandler {
    private final TaskService taskService;
    private final ProjectService projectService;
    private final TagService tagService;
    private final UserStoryService userStoryService;
    private final EpicService epicService;

    public ProjectHandler(TaskService taskService, ProjectService projectService, TagService tagService,
            UserStoryService userStoryService, EpicService epicService) {
        this.taskService = taskService;
        this.projectService = projectService;
        this.tagService = tagService;
        this.userStoryService = userStoryService;
        this.epicService = epicService;
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

    // get all the users in a project
    @GetMapping("/{project_id}/users")
    public List<ProjectUserSummary> getUsers(@PathVariable("project_id") String projectId) {
        return this.projectService.getUsersInProject(projectId);
    }

    @GetMapping("/{project_id}/{column_id}/{task_id}")
    public TaskResponse getTaskInformation(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @PathVariable("task_id") String taskId) {
        return this.taskService.getTask(projectId, columnId, taskId);
    }

    @GetMapping("/{project_id}/archived")
    public List<TaskSummaryResponse> getArchivedTasks(@PathVariable("project_id") String projectId) {
        return this.taskService.getArchivedTask(projectId);
    }

    @PostMapping("/{project_id}/{column_id}/tasks")
    public TaskResponse addTask(@PathVariable("project_id") String projectId,
            @PathVariable("column_id") String columnId, @Validated @RequestBody ProjectTaskRequest request) {
        TaskEntity task = this.taskService.createTask(request, projectId, columnId);
        return EntityMapper.mapToTaskResponse(task);
    }

    @GetMapping("/{project_id}/tags")
    public List<TagResponse> getTag(@PathVariable("project_id") String projectId) {
        return this.tagService.getTags(projectId);
    }

    @PostMapping("/{project_id}/tags")
    public TagResponse addTag(@PathVariable("project_id") String projectId,
            @Validated @RequestBody TagRequest request) {
        return this.tagService.createTag(request, projectId);
    }

    @DeleteMapping("/{project_id}/tags/{tag_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(@PathVariable("project_id") String projectId,
            @PathVariable("tag_id") String tagId) {
        this.tagService.deleteTag(tagId);
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

    @GetMapping("/{project_id}/userstory")
    public List<UserStoryResponse> getStories(@PathVariable("project_id") String projectId) {
        return this.userStoryService.getUserStories(projectId);
    }

    @GetMapping("/{project_id}/userstory/{story_id}")
    public UserStoryDetailsResponse getStoryDetails(@PathVariable("project_id") String projectId,
            @PathVariable("story_id") String storyId) {
        return this.userStoryService.getStoryDetails(storyId, projectId);
    }

    @PostMapping("/{project_id}/userstory")
    public UserStoryResponse addStory(@PathVariable("project_id") String projectId,
            @Validated @RequestBody UserStoryRequest request) {
        return this.userStoryService.createUserStory(projectId, request);
    }

    @PatchMapping("/{project_id}/userstory/{story_id}")
    public UserStoryResponse editStory(@PathVariable("project_id") String projectId,
            @PathVariable("story_id") String storyId, @Validated @RequestBody UserStoryRequest request) {
        return this.userStoryService.updateUserStory(storyId, request);
    }

    @DeleteMapping("/{project_id}/userstory/{story_id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStory(@PathVariable("project_id") String projectId, @PathVariable("story_id") String storyId) {
        this.userStoryService.deleteUserStory(storyId);
    }

    @DeleteMapping
    public String deleteProject() {
        // do something
        return "deleted project";
        // this.projectService.seet
    }

    @GetMapping("/{project_id}/epics")
    public List<EpicResponse> getEpics(@PathVariable("project_id") String projectId) {
        return this.epicService.getEpics(projectId);
    }

    @GetMapping("/{project_id}/epics/{epic_id}")
    public EpicResponse getEpicDetails(@PathVariable("project_id") String projectId,
            @PathVariable("epic_id") String epicId) {
        return this.epicService.getEpicDetails(epicId, projectId);
    }

    @PostMapping("/{project_id}/epics")
    public EpicResponse createEpic(@PathVariable("project_id") String projectId,
            @Validated @RequestBody EpicRequest request) {
        return this.epicService.createEpic(projectId, request);
    }

    @PatchMapping("/{project_id}/epics/{epic_id}")
    public EpicResponse updateEpic(@PathVariable("project_id") String projectId,
            @PathVariable("epic_id") String epicId,
            @Validated @RequestBody EpicRequest request) {
        return this.epicService.updateEpic(epicId, request);
    }
}
