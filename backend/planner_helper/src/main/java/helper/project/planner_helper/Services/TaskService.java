package helper.project.planner_helper.Services;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.Repository.TaskRepository;

@Service
public class TaskService {
    private final TaskRepository taskRepository; // final to make sure it is immutable

    // constructor
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public String createTask(String task_name) {
        return "Task id";
    }

    public String deleteTask(String task_id) {
        return "DEleted task";
    }

    public List<String> getAllTask(String project_id) {
        return Arrays.asList("null", "null");
    }
}
