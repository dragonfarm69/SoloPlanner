package helper.project.planner_helper.Handler;

import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserHandler {
    @GetMapping
    public String getUsersInfo() {
        return "this is user info";
    }

    @PostMapping
    public String createNewUser() {
        // do something
        return "created new user";
    }

    @DeleteMapping
    public String deleteUser() {
        // do something
        return "deleted user";
    }

    @GetMapping("/groups")
    public List<String> getUserGroups() {
        return Arrays.asList("group 1", "group 2");
    }
}
