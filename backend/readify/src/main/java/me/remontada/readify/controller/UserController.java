package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.UserResponseDTO;
import me.remontada.readify.mapper.UserMapper;
import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;


@Slf4j
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }


    @GetMapping
    @PreAuthorize("hasAuthority('CAN_READ_USERS')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            log.info("Admin {} requesting all users", currentUser.getEmail());

            List<User> users = userService.findAll();

            List<UserResponseDTO> userDTOs = UserMapper.toResponseDTOList(users);

            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            log.error("Error fetching all users", e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_READ_USERS')")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            log.info("Admin {} requesting user with ID: {}", currentUser.getEmail(), id);

            return userService.findById(id)
                    .map(user -> ResponseEntity.ok(UserMapper.toResponseDTO(user)))
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error fetching user with ID: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }


    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");

            if ("123456".equals(code)) {
                Optional<User> userOpt = userService.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setEmailVerified(true);
                    userService.save(user);

                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "Email successfully verified"
                    ));
                }
            }

            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid verification code"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @PostMapping("/verify-phone")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> verifyPhone(@RequestBody Map<String, String> request) {
        try {
            String phoneNumber = Optional.ofNullable(request.get("phoneNumber"))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .orElseThrow(() -> new IllegalArgumentException("Phone number is required"));

            String verificationCode = Optional.ofNullable(request.get("verificationCode"))
                    .or(() -> Optional.ofNullable(request.get("code")))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .orElseThrow(() -> new IllegalArgumentException("Verification code is required"));

            User user = userService.verifyPhone(phoneNumber, verificationCode);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Phone successfully verified",
                    "user", UserMapper.toResponseDTO(user)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Phone verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Phone verification failed"
            ));
        }
    }


    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody Map<String, String> request) {
        try {
            String firstName = request.get("firstName");
            String lastName = request.get("lastName");
            String email = request.get("email");
            String phoneNumber = request.get("phoneNumber");
            String password = request.get("password");

            User user = userService.createUser(firstName, lastName, email, phoneNumber, password);

            log.info("User registered successfully: {}", user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User created successfully",
                    "userId", user.getId(),
                    "user", UserMapper.toResponseDTO(user)
            ));
        } catch (Exception e) {
            log.error("User registration failed", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        return userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}