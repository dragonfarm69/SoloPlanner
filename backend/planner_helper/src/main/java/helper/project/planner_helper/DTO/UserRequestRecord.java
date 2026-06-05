package helper.project.planner_helper.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequestRecord(
                @NotBlank(message = "username is required") String username,
                @NotBlank(message = "firstName is required") String firstName,
                @NotBlank(message = "lastName is required") String lastName,
                @NotBlank(message = "password is required") String password,
                @Email(message = "email is invalid") String email) {
}
