package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.ProjectTaskRequest;
import helper.project.planner_helper.DTO.TaskEditRequest;
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

    // constructor
    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
            TaskColumnRepository taskColumnRepository, UserRepository userRepository,
            TagRepository tagRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.taskColumnRepository = taskColumnRepository;
        this.userRepository = userRepository;
        this.tagRepository = tagRepository;
    }

    public List<TaskEntity> getUserTasks(UUID userId) {
        return this.taskRepository.findTaskByUserId(userId);
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
        return this.taskRepository.save(task);
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

        return this.taskRepository.save(task);
    }

    public List<TaskEntity> getProjectTasks(UUID projectId) {
        return this.taskRepository.findTaskByProjectId(projectId);
    }
}
