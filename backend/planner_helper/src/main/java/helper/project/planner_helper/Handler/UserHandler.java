package helper.project.planner_helper.Handler;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.GroupResponse;
import helper.project.planner_helper.DTO.UserRequestRecord;
import helper.project.planner_helper.DTO.UserResponse;
import helper.project.planner_helper.Database.GroupEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Services.GroupService;
import helper.project.planner_helper.Services.UserService;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/user")
public class UserHandler {
    private final UserService userService;
    private final GroupService groupService;

    public UserHandler(UserService userService, GroupService groupService) {
        this.userService = userService;
        this.groupService = groupService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getUsersInfo(@CookieValue(name = "access_token") String accessToken) {
        // get id in access_token
        String[] chunks = accessToken.split("\\.");
        Base64.Decoder decoder = Base64.getUrlDecoder();

        String payload = new String(decoder.decode(chunks[1]));
        ObjectMapper mapper = new ObjectMapper();

        Map<String, Object> payloadMap = mapper.readValue(payload, new TypeReference<Map<String, Object>>() {
        });

        String userId = (String) payloadMap.get("sub");

        System.out.println("user id: " + userId);

        UserEntity user = this.userService.findUser(userId);
        UserResponse userResponse = EntityMapper.mapToUserResponse(user);
        return ResponseEntity.ok().body(userResponse);
    }

    @PostMapping
    public String createNewUser(@Validated @RequestBody UserRequestRecord request) {
        // do something
        userService.createUser(request);
        return "created new user";
    }

    @DeleteMapping
    public String deleteUser() {
        // do something
        return "deleted user";
    }

    @GetMapping("/me/groups")
    public ResponseEntity<List<GroupResponse>> getUserGroups(@CookieValue(name = "access_token") String accessToken) {
        String[] chunks = accessToken.split("\\.");
        Base64.Decoder decoder = Base64.getUrlDecoder();
        String payload = new String(decoder.decode(chunks[1]));
        ObjectMapper mapper = new ObjectMapper();

        try {
            Map<String, Object> payloadMap = mapper.readValue(payload, new TypeReference<Map<String, Object>>() {
            });
            String userId = (String) payloadMap.get("sub");
            UserEntity user = this.userService.findUser(userId);
            List<GroupEntity> groups = this.groupService.getUserGroups(user.getId());
            List<GroupResponse> groupResponses = groups.stream()
                    .map(EntityMapper::mapToGroupResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(groupResponses);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decode token and fetch groups", e);
        }
    }
}
