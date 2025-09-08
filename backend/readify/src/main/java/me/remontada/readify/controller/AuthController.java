package me.remontada.readify.controller;

import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import me.remontada.readify.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(UserService userService, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            // Find user by email
            Optional<User> userOptional = userService.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Invalid credentials"
                ));
            }

            User user = userOptional.get();

            // Check password
            if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Invalid credentials"
                ));
            }

            // Check if user is active
            if (!user.getActive()) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Account is deactivated"
                ));
            }

            // Check if email is verified
            if (!user.getEmailVerified()) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Please verify your email first",
                        "emailVerificationRequired", true
                ));
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(email);

            // Update last login time
            user.setLastLoginAt(LocalDateTime.now());
            userService.save(user);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", token,
                    "user", Map.of(
                            "id", user.getId(),
                            "firstName", user.getFirstName(),
                            "lastName", user.getLastName(),
                            "email", user.getEmail(),
                            "phoneNumber", user.getPhoneNumber(),
                            "emailVerified", user.getEmailVerified(),
                            "phoneVerified", user.getPhoneVerified(),
                            "permissions", user.getPermissions()
                    )
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Login failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logout successful"
        ));
    }
}