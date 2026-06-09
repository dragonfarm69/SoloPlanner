package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.ProjectTaskRequest;
import helper.project.planner_helper.Database.ProjectEntity;
import helper.project.planner_helper.Database.TaskColumn;
import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.ProjectRepository;
import helper.project.planner_helper.Repository.TaskColumnRepository;
import helper.project.planner_helper.Repository.TaskRepository;
import helper.project.planner_helper.Repository.UserRepository;

@Service
public class TaskService {
    private final TaskRepository taskRepository; // final to make sure it is immutable
    private final ProjectRepository projectRepository;
    private final TaskColumnRepository taskColumnRepository;
    private final UserRepository userRepository;

    // constructor
    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
            TaskColumnRepository taskColumnRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.taskColumnRepository = taskColumnRepository;
        this.userRepository = userRepository;
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

        int nextOrder = 0;
        if (columnEntity.getTasks() != null) {
            nextOrder = columnEntity.getTasks().size();
        }

        TaskEntity task = EntityMapper.mapToTaskEntity(request, projectEntity, userEntity, columnEntity);
        task.setOrder(nextOrder);

        return this.taskRepository.save(task);
    }

    public String deleteTask(UUID taskId) {
        this.taskRepository.deleteById(taskId);

        return "Deleted " + taskId.toString();
    }

    public List<TaskEntity> getProjectTasks(UUID projectId) {
        return this.taskRepository.findTaskByProjectId(projectId);
    }
}
