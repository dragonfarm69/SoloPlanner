package helper.project.planner_helper.Services;

import java.net.HttpURLConnection;
import java.util.List;
import java.util.Map;

import javax.print.attribute.standard.Media;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import helper.project.planner_helper.DTO.KeyCloakPayload;
import helper.project.planner_helper.DTO.UserRequestRecord;
import helper.project.planner_helper.Database.UserEntity;
import helper.project.planner_helper.Repository.UserRepository;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Service
public class UserService {
    private final UserRepository userRepository; // final to make sure it is immutable

    // constructor
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity findUser(String userId) {
        return this.userRepository.findUserByUserId(userId);
    }

    public UserEntity createUser(UserRequestRecord request) {
        // save to keycloak
        final String tokenEndpoint = "http://localhost:8080/realms/planner/protocol/openid-connect/token";
        final String registerEndpoint = "http://localhost:8080/admin/realms/planner/users";

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "client_credentials");
        formData.add("client_id", "authentication-cli");
        formData.add("client_secret", "xCorIsBiqqnrm3J5v8Xv7RiSvR5aKikI");

        // make request to keycloak
        RestClient client = RestClient.create();
        Map<String, Object> tokenResponse = client.post()
                .uri("http://localhost:8080/realms/planner/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {
                });

        String accessToken = (String) tokenResponse.get("access_token");

        System.out.println("access token: " + accessToken);

        ObjectMapper mapper = new ObjectMapper();

        // Create the root object
        ObjectNode payload = mapper.createObjectNode();
        payload.put("username", request.username());
        payload.put("email", request.email());
        payload.put("enabled", true);

        // Create the nested credential array
        ObjectNode credential = mapper.createObjectNode();
        credential.put("type", "password");
        credential.put("value", request.password());
        credential.put("temporary", false);

        payload.putIfAbsent("credentials", mapper.createArrayNode().add(credential));

        // Convert to String if your HTTP client requires a raw string body:
        String jsonString = payload.toString();
        try {
            client.post()
                    .uri(registerEndpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .body(jsonString)
                    .retrieve()
                    .onStatus(status -> status.equals(HttpStatus.CONFLICT), (req, res) -> {
                        throw new RuntimeException(
                                "User registration failed: Username or Email already exists in Keycloak (409 Conflict).");
                    })
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> {
                        throw new RuntimeException(
                                "Keycloak client error: " + res.getStatusCode() + " " + res.getStatusText());
                    })
                    .onStatus(status -> status.is5xxServerError(), (req, res) -> {
                        throw new RuntimeException(
                                "Keycloak server error: " + res.getStatusCode() + " " + res.getStatusText());
                    })
                    .toBodilessEntity(); // created with no response body

        } catch (RestClientResponseException ex) {
            throw new RuntimeException("HTTP error when communicate with keycloak: " + ex.getMessage(), ex);
        }

        // save to db if success
        UserEntity user = new UserEntity();

        user.setUsername(request.username());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());

        return this.userRepository.save(user);
    }
}
