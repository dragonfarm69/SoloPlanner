package helper.Services;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class TaskService {
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
