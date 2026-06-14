package helper.project.planner_helper.Handler;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import helper.project.planner_helper.DTO.UserRequestRecord;
import helper.project.planner_helper.Services.UserService;

@RestController
@RequestMapping("/auth")
public class AuthHandler {
    private final UserService userService;

    public AuthHandler(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public String register(@Validated @RequestBody UserRequestRecord request) {
        this.userService.createUser(request);
        return "register";
    }

    // keycloak callback is a GET request
    @GetMapping("/login")
    public ResponseEntity<Void> login(@RequestParam String code) {
        System.out.println("Code: " + code);

        // request token from keycloak
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", "authentication-cli");
        formData.add("client_secret", "xCorIsBiqqnrm3J5v8Xv7RiSvR5aKikI");
        formData.add("code", code);
        formData.add("redirect_uri", "http://localhost:8081/auth/login");

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
        String refreshToken = (String) tokenResponse.get("refresh_token");

        ResponseCookie accessTokenCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(false) // should be true
                .maxAge(Duration.ofHours(10)) // 10 hours for now
                .path("/").build();

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true) // Protects against XSS attacks
                .secure(false) // Set to true in production (HTTPS)
                .path("/") // Makes it available everywhere on the domain
                .maxAge(3600 * 24 * 7) // 1 week
                .build();

        return ResponseEntity.status(HttpStatus.FOUND) // 302
                .location(URI.create("http://localhost:5173/"))
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .build();
    }
}
