package helper.project.planner_helper.Services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.Database.TaskEntity;
import helper.project.planner_helper.Repository.TaskRepository;

@Service
public class TaskService {
    private final TaskRepository taskRepository; // final to make sure it is immutable

    // constructor
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskEntity> getUserTasks(UUID userId) {
        return this.taskRepository.findTaskByUserId(userId);
    }

    public TaskEntity createTask(TaskEntity task) {
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
