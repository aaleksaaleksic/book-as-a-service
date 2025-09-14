package me.remontada.readify.controller;
import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.UserResponseDTO;
import me.remontada.readify.mapper.UserMapper;
import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import me.remontada.readify.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;


@Slf4j
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

            log.info("Login attempt for email: {}", email);

            // Find user by email
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.warn("Login failed - user not found: {}", email);
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Invalid credentials"
                ));
            }

            User user = userOpt.get();

            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Login failed - invalid password for user: {}", email);
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Invalid credentials"
                ));
            }

            if (!user.getActive()) {
                log.warn("Login failed - inactive user: {}", email);
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Account is deactivated"
                ));
            }

            String token = jwtUtil.generateToken(email);

            user.updateLastLogin();
            userService.save(user);


            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", token,
                    // CRITICAL FIX: Use UserMapper instead of ad-hoc user data mapping
                    "user", UserMapper.toResponseDTO(user)
            ));

        } catch (Exception e) {
            log.error("Login failed due to server error", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Login failed: " + e.getMessage()
            ));
        }
    }


    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            org.springframework.security.core.Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Not authenticated"
                ));
            }

            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);

            if (userOpt.isEmpty()) {
                log.warn("Authenticated user not found in database: {}", email);
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            User user = userOpt.get();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    // CRITICAL FIX: Use UserMapper instead of ad-hoc user data mapping
                    "user", UserMapper.toResponseDTO(user)
            ));

        } catch (Exception e) {
            log.error("Error fetching current user", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error fetching user data"
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


    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            log.info("Password reset requested for email: {}", email);

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "If the email exists, password reset instructions have been sent"
                ));
            }

            User user = userOpt.get();
            // TODO: Implement actual password reset token generation and email sending
            // For now, just log the request
            log.info("Password reset would be sent to user: {}", user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "If the email exists, password reset instructions have been sent"
            ));

        } catch (Exception e) {
            log.error("Error processing password reset request", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error processing password reset request"
            ));
        }
    }


    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Not authenticated"
                ));
            }

            String email = authentication.getName();
            Optional<User> userOpt = userService.findByEmail(email);

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            User user = userOpt.get();

            if (!user.getActive()) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Account is deactivated"
                ));
            }

            String newToken = jwtUtil.generateToken(email);

            log.info("Token refreshed for user: {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Token refreshed successfully",
                    "token", newToken,
                    "user", UserMapper.toResponseDTO(user)
            ));

        } catch (Exception e) {
            log.error("Error refreshing token", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error refreshing token"
            ));
        }
    }
}