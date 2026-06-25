package helper.project.planner_helper.Services;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.Database.GroupEntity;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.GroupRepository;
import helper.project.planner_helper.Repository.UserRepository;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    public GroupService(GroupRepository groupRepository, UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    public String generateInviteCode() {
        StringBuilder sb = new StringBuilder("INV-");
        for (int i = 0; i < CODE_LENGTH; i++) {
            int randomIndex = random.nextInt(ALPHANUMERIC.length());
            sb.append(ALPHANUMERIC.charAt(randomIndex));
        }
        return sb.toString();
    }

    public GroupEntity createGroup(String name) {
        GroupEntity group = new GroupEntity();
        group.setName(name);
        group.setInviteCode(generateInviteCode());
        group.setUsers(new ArrayList<>());
        return groupRepository.save(group);
    }

    public void deleteGroup(UUID groupId) {
        groupRepository.deleteById(groupId);
    }

    public GroupEntity updateGroup(UUID groupId, String name) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with ID: " + groupId));
        group.setName(name);
        return groupRepository.save(group);
    }

    public void addUserToGroup(UUID groupId, UUID userId) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with ID: " + groupId));
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        if (group.getUsers() == null) {
            group.setUsers(new ArrayList<>());
        }

        if (!group.getUsers().contains(user)) {
            group.getUsers().add(user);
            groupRepository.save(group);
        }
    }

    public void addUserToGroupByInviteCode(String inviteCode, UUID userId) {
        GroupEntity group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Group not found with invite code: " + inviteCode));
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        if (group.getUsers() == null) {
            group.setUsers(new ArrayList<>());
        }

        if (!group.getUsers().contains(user)) {
            group.getUsers().add(user);
            groupRepository.save(group);
        }
    }

    public java.util.List<UserEntity> getUsersInGroup(UUID groupId) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with ID: " + groupId));
        return group.getUsers() != null ? group.getUsers() : new java.util.ArrayList<>();
    }

    public List<GroupEntity> getUserGroups(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return user.getGroups() != null ? user.getGroups() : new ArrayList<>();
    }
}
