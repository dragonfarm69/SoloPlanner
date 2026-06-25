package helper.project.planner_helper.Handler;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import helper.project.planner_helper.DTO.AddUserToGroupRequest;
import helper.project.planner_helper.DTO.EntityMapper;
import helper.project.planner_helper.DTO.GroupRequest;
import helper.project.planner_helper.DTO.GroupResponse;
import helper.project.planner_helper.DTO.UserResponse;
import helper.project.planner_helper.Database.GroupEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Services.GroupService;

@RestController
@RequestMapping("/group")
public class GroupHandler {

    private final GroupService groupService;

    public GroupHandler(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@RequestBody GroupRequest request) {
        GroupEntity group = groupService.createGroup(request.name());
        return ResponseEntity.ok(EntityMapper.mapToGroupResponse(group));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<GroupResponse> updateGroup(
            @PathVariable UUID groupId,
            @RequestBody GroupRequest request) {
        GroupEntity group = groupService.updateGroup(groupId, request.name());
        return ResponseEntity.ok(EntityMapper.mapToGroupResponse(group));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable UUID groupId) {
        groupService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/users")
    public ResponseEntity<Void> addUserToGroup(
            @PathVariable UUID groupId,
            @RequestBody AddUserToGroupRequest request) {
        groupService.addUserToGroup(groupId, UUID.fromString(request.userId()));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/join")
    public ResponseEntity<Void> joinGroup(@RequestBody AddUserToGroupRequest request) {
        groupService.addUserToGroupByInviteCode(request.inviteCode(), UUID.fromString(request.userId()));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/users")
    public ResponseEntity<List<UserResponse>> getUsersInGroup(@PathVariable UUID groupId) {
        List<UserEntity> users = groupService.getUsersInGroup(groupId);
        List<UserResponse> userResponses = users.stream()
                .map(EntityMapper::mapToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }
}
