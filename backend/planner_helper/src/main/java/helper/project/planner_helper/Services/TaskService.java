package helper.project.planner_helper.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import javax.swing.text.html.HTML.Tag;
import javax.swing.text.html.parser.Entity;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.ProjectTaskRequest;
import helper.project.planner_helper.DTO.TaskEditRequest;
import helper.project.planner_helper.DTO.TaskPositionRequest;
import helper.project.planner_helper.DTO.Events.EventPayload;
import helper.project.planner_helper.DTO.Events.TaskResponse;
import helper.project.planner_helper.DTO.Events.TaskSummaryResponse;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TagEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.TagRepository;
import helper.project.planner_helper.Repository.TaskColumnRepository;
import helper.project.planner_helper.Repository.TaskRepository;
import helper.project.planner_helper.Repository.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class TaskService {
    private final TaskRepository taskRepository; // final to make sure it is immutable
    private final ProjectRepository projectRepository;
    private final TaskColumnRepository taskColumnRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final SimpMessagingTemplate mesageTemplate;

    // constructor
    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
            TaskColumnRepository taskColumnRepository, UserRepository userRepository,
            TagRepository tagRepository, SimpMessagingTemplate mesageTemplate) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.taskColumnRepository = taskColumnRepository;
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
        this.mesageTemplate = mesageTemplate;
    }

    public List<TaskEntity> getUserTasks(UUID userId) {
        return this.taskRepository.findTaskByUserId(userId);
    }

    public TaskResponse getTask(String projectId, String columnId, String taskId) {
        UUID taskUUID = UUID.fromString(taskId);

        TaskEntity taskEntity = this.taskRepository.findById(taskUUID)
                .orElseThrow(() -> new RuntimeException("Task not found " + taskId));

        TaskResponse task = EntityMapper.mapToTaskResponse(taskEntity);
        return task;
    }

    public TaskEntity createTask(ProjectTaskRequest request, String projectId, String columnId) {
        UUID projectUUID = UUID.fromString(projectId);
        UUID columnUUID = UUID.fromString(columnId);
        UUID userUUID = UUID.fromString(request.userId());

        ProjectEntity projectEntity = this.projectRepository.findById(projectUUID)
                .orElseThrow(() -> new RuntimeException("Project not found " + projectId));
        TaskColumn columnEntity = this.taskColumnRepository.findById(columnUUID)
                .orElseThrow(() -> new RuntimeException("Column not found " + columnId));

        UserEntity userEntity = this.userRepository.findById(userUUID)
                .orElseThrow(() -> new RuntimeException("User not found " + columnId));

        TaskEntity task = EntityMapper.mapToTaskEntity(request, projectEntity, userEntity, columnEntity);

        TaskEntity latestTask = this.taskRepository.findLatestTaskByProjectId(projectUUID, columnUUID)
                .orElse(null);

        // first task in the column
        if (latestTask == null) {
            String order = Integer.toString(100000, 36);
            task.setOrder(order);
        } else {
            int latestOrder = Integer.parseInt(latestTask.getOrder(), 36); // parse latest task order to int
            int newestOrder = latestOrder + 100000;

            String newOrder = Integer.toString(newestOrder, 36);
            task.setOrder(newOrder);
        }

        // find all the tags and set them to task
        List<TagEntity> tags = new ArrayList<>();

        if (request.tagIds() != null) {
            for (String tagId : request.tagIds()) {
                UUID tagUuid = UUID.fromString(tagId);
                TagEntity tag = this.tagRepository.findById(tagUuid)
                        .orElseThrow(() -> new RuntimeException("This tag does not exists: " + tagId));
                tags.add(tag);
            }
        }

        task.setTags(tags);

        TaskEntity createdTask = this.taskRepository.save(task);

        // broad cast the event
        TaskSummaryResponse response = EntityMapper.mapToTaskSummaryResponse(createdTask);
        EventPayload payload = new EventPayload.TaskCreatedEvent(response);

        String destination = "/topic/projects/" + projectId;
        System.out.println("SENDING TO " + destination);
        this.mesageTemplate.convertAndSend(destination, payload);

        return createdTask;
    }

    public void deleteTask(String taskId, String projectId, String columnId) {
        UUID taskUUID = EntityMapper.mapToUUID(taskId);
        UUID projectUUID = EntityMapper.mapToUUID(projectId);
        UUID columnUUID = EntityMapper.mapToUUID(columnId);

        TaskEntity task = this.taskRepository.findById(taskUUID)
                .orElseThrow(() -> new RuntimeException("Task not found " + taskId));

        if (!task.getProject().getId().equals(projectUUID)) {
            throw new RuntimeException("This task does not belong to this project: " + projectId);
        }
        if (!task.getColumn().getId().equals(columnUUID)) {
            throw new RuntimeException("This task does not belong to this column: " + columnId);
        }

        this.taskRepository.delete(task);
    }

    @Transactional
    public TaskEntity editTask(String taskId, String projectId, String columnId, TaskEditRequest request) {
        UUID taskUUID = EntityMapper.mapToUUID(taskId);
        UUID projectUUID = EntityMapper.mapToUUID(projectId);
        UUID columnUUID = EntityMapper.mapToUUID(columnId);

        TaskEntity task = this.taskRepository.findById(taskUUID)
                .orElseThrow(() -> new RuntimeException("Task not found " + taskId));

        if (!task.getProject().getId().equals(projectUUID)) {
            throw new RuntimeException("This task does not belong to this project: " + projectId);
        }
        if (!task.getColumn().getId().equals(columnUUID)) {
            throw new RuntimeException("This task does not belong to this column: " + columnId);
        }

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.deadline() != null) {
            task.setDeadline(request.deadline());
        }
        if (request.tagIds() != null) {
            List<UUID> tagUUIDs = request.tagIds().stream()
                    .map(UUID::fromString)
                    .toList();
            List<TagEntity> tags = this.tagRepository.findAllById(tagUUIDs);
            task.setTags(tags);
        }
        if (request.userId() != null) {
            UUID userUUID = UUID.fromString(request.userId());
            UserEntity user = this.userRepository.findById(userUUID)
                    .orElseThrow(() -> new RuntimeException("User not found " + request.userId()));
            task.setUser(user);
        }

        TaskEntity editedTask = this.taskRepository.save(task);

        // broad cast the event
        TaskSummaryResponse response = EntityMapper.mapToTaskSummaryResponse(editedTask);
        EventPayload payload = new EventPayload.TaskEditedEvent(response);

        String destination = "/topic/projects/" + projectId;
        System.out.println("SENDING TO " + destination);
        this.mesageTemplate.convertAndSend(destination, payload);
        return editedTask;
    }

    public void moveTask(String taskId, String projectId, String columnId, TaskPositionRequest request) {
        UUID taskUUID = EntityMapper.mapToUUID(taskId);
        UUID projectUUID = EntityMapper.mapToUUID(projectId);
        UUID columnUUID = EntityMapper.mapToUUID(request.columnId());

        TaskEntity task = this.taskRepository.findById(taskUUID)
                .orElseThrow(() -> new RuntimeException("Task not found " + taskId));

        if (!task.getProject().getId().equals(projectUUID)) {
            throw new RuntimeException("This task does not belong to this project: " + projectId);
        }

        if (!task.getColumn().getId().equals(columnUUID)) {
            TaskColumn column = this.taskColumnRepository.findById(columnUUID)
                    .orElseThrow(() -> new RuntimeException("Column not found " + taskId));
            task.setColumn(column);
        }

        UUID prevTaskUUID = EntityMapper.mapToUUID(request.prevTaskId());
        UUID nextTaskUUID = EntityMapper.mapToUUID(request.nextTaskId());

        TaskEntity prevTask = null;
        TaskEntity nextTask = null;

        // If it not null then it should've exists
        if (prevTaskUUID != null) {
            prevTask = this.taskRepository.findById(prevTaskUUID)
                    .orElseThrow(() -> new RuntimeException("This prev task should exists: " + request.prevTaskId()));
        }

        if (nextTaskUUID != null) {
            nextTask = this.taskRepository.findById(nextTaskUUID)
                    .orElseThrow(() -> new RuntimeException("This next task should exists: " + request.nextTaskId()));
        }
        // TODO: HANDLE CASE WHERE AT THE TOP OR BOTTOM, WE RAN OUT OF SPACE (midpoint
        // is 0 or always return the same value)

        System.out.println("prev ORDER: " + request.prevTaskId());
        System.out.println("next ORDER: " + request.nextTaskId());

        int newOrderInt;
        if (prevTask == null && nextTask == null) {
            // Case 1: Column is empty;
            newOrderInt = 100000;
        } else if (prevTask == null) {
            // Case 2: Dropped at the very top
            int nextOrder = Integer.parseInt(nextTask.getOrder(), 36);
            newOrderInt = nextOrder / 2;
        } else if (nextTask == null) {
            // Case 3: Dropped at the very bottom
            int prevOrder = Integer.parseInt(prevTask.getOrder(), 36);
            newOrderInt = prevOrder + 100000;
        } else {
            // Case 4: Dropped in between two tasks
            int prevOrder = Integer.parseInt(prevTask.getOrder(), 36);
            int nextOrder = Integer.parseInt(nextTask.getOrder(), 36);
            newOrderInt = (prevOrder + nextOrder) / 2;
        }

        System.out.println("NEW ORDER: " + newOrderInt);
        String newOrder = Integer.toString(newOrderInt, 36);
        task.setOrder(newOrder);

        this.taskRepository.save(task);

        // broad cast the event
        EventPayload payload = new EventPayload.TaskMovedEvent(taskId, columnId, newOrder);
        String destination = "/topic/projects/" + projectId;

        this.mesageTemplate.convertAndSend(destination, payload);
    }

    public List<TaskEntity> getProjectTasks(UUID projectId) {
        return this.taskRepository.findTaskByProjectId(projectId);
    }
}
