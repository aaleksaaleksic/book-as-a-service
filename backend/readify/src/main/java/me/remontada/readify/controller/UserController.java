package me.remontada.readify.controller;

import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<User>> getAllUsers(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            List<User> users = userService.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_READ_USERS')")
    public ResponseEntity<User> getUserById(@PathVariable Long id, Authentication authentication) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            User user = userService.verifyEmail(token);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email verified successfully",
                    "user", user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
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

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User created successfully",
                    "userId", user.getId(),
                    "emailVerificationToken", user.getEmailVerificationToken(),
                    "phoneVerificationCode", user.getPhoneVerificationCode() // Za testiranje
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<Map<String, Object>> verifyPhone(@RequestBody Map<String, String> request) {
        try {
            String phoneNumber = request.get("phoneNumber");
            String code = request.get("code");

            User user = userService.verifyPhone(phoneNumber, code);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Phone verified successfully",
                    "user", user.getPhoneNumber()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new RuntimeException("User not authenticated");
        }
        return (User) authentication.getPrincipal();
    }
}