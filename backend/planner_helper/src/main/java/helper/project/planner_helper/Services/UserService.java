package helper.project.planner_helper.Services;

import org.springframework.stereotype.Service;

import helper.project.planner_helper.DTO.UserRequestRecord;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository; // final to make sure it is immutable

    // constructor
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity createUser(UserRequestRecord request) {
        UserEntity user = new UserEntity();

        user.setUsername(request.username());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());

        return this.userRepository.save(user);
    }
}
