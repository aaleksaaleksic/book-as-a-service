package me.remontada.readify.controller;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.ForgotPasswordRequestDTO;
import me.remontada.readify.dto.request.LoginRequestDTO;
import me.remontada.readify.dto.request.RefreshTokenRequestDTO;
import me.remontada.readify.dto.request.ResetPasswordRequestDTO;
import me.remontada.readify.dto.response.UserResponseDTO;
import me.remontada.readify.mapper.UserMapper;
import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import me.remontada.readify.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
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
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestDTO request) {
        try {
            String email = request.getEmail();
            String password = request.getPassword();

            log.info("Login attempt for email: {}", email);

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.warn("Login failed - user not found: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "errorCode", "USER_NOT_FOUND",
                        "message", "Account with the provided email address does not exist"
                ));
            }

            User user = userOpt.get();

            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Login failed - invalid password for user: {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "success", false,
                        "errorCode", "INVALID_PASSWORD",
                        "message", "Incorrect password"
                ));
            }

            if (!user.getActive()) {
                log.warn("Login failed - inactive user: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "success", false,
                        "errorCode", "ACCOUNT_DEACTIVATED",
                        "message", "Account is deactivated"
                ));
            }

            String token = jwtUtil.generateToken(email);
            String refreshToken = jwtUtil.generateRefreshToken(email);

            // Extract session ID from token and store it to invalidate other sessions
            String sessionId = jwtUtil.extractSessionId(token);
            user.setCurrentSessionToken(sessionId);
            user.updateLastLogin();
            userService.save(user);

            log.info("User {} logged in. New session created: {}", email, sessionId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", token,
                    "refreshToken", refreshToken,
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
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
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
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> logout(Authentication authentication) {
        try {
            if (authentication != null && authentication.getName() != null) {
                String email = authentication.getName();
                Optional<User> userOpt = userService.findByEmail(email);

                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setCurrentSessionToken(null);
                    userService.save(user);
                    log.info("User {} logged out. Session cleared.", email);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Logout successful"
            ));
        } catch (Exception e) {
            log.error("Error during logout", e);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Logout successful"
            ));
        }
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
        try {
            String email = request.getEmail();
            log.info("Password reset requested for email: {}", email);

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                // Return success even if user doesn't exist (security best practice)
                log.warn("Password reset requested for non-existent email: {}", email);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "If the email exists, password reset instructions have been sent"
                ));
            }

            // Generate password reset token and send email
            userService.generatePasswordResetToken(email);
            log.info("Password reset token generated and email sent to: {}", email);

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


    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
        try {
            String token = request.getToken();
            String newPassword = request.getNewPassword();

            log.info("Password reset attempt with token: {}", token.substring(0, Math.min(8, token.length())) + "...");

            // Reset the password
            userService.resetPassword(token, newPassword);

            log.info("Password successfully reset for token");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password has been reset successfully"
            ));

        } catch (RuntimeException e) {
            log.warn("Password reset failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error resetting password", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Error resetting password"
            ));
        }
    }


    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@Valid @RequestBody RefreshTokenRequestDTO request) {
        try {
            String refreshToken = request.getRefreshToken();

            if (refreshToken == null || !jwtUtil.validateRefreshToken(refreshToken)) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Invalid refresh token"
                ));
            }

            String email = jwtUtil.extractEmailFromRefreshToken(refreshToken);
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
            String newRefreshToken = jwtUtil.generateRefreshToken(email);

            log.info("Token refreshed for user: {}", email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Token refreshed successfully",
                    "token", newToken,
                    "refreshToken", newRefreshToken,
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