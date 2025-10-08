package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.UserResponseDTO;
import me.remontada.readify.mapper.UserMapper;
import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@Slf4j
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final me.remontada.readify.service.VerificationRateLimitService rateLimitService;

    @Autowired
    public UserController(UserService userService, me.remontada.readify.service.VerificationRateLimitService rateLimitService) {
        this.userService = userService;
        this.rateLimitService = rateLimitService;
    }


    @GetMapping
    @PreAuthorize("hasAuthority('CAN_READ_USERS')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "lastName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            log.info("Admin {} requesting all users (page: {}, size: {}, sortBy: {}, direction: {})",
                    currentUser.getEmail(), page, size, sortBy, sortDirection);

            // If size is -1, return all users without pagination (for backward compatibility)
            if (size == -1) {
                List<User> users = userService.findAll();
                List<UserResponseDTO> userDTOs = UserMapper.toResponseDTOList(users);
                return ResponseEntity.ok(userDTOs);
            }

            // Create sort object
            Sort sort = sortDirection.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

            // Create pageable
            Pageable pageable = PageRequest.of(page, size, sort);

            // Get paginated users
            Page<User> usersPage = userService.findAll(pageable);

            // Map to DTOs
            List<UserResponseDTO> userDTOs = UserMapper.toResponseDTOList(usersPage.getContent());

            // Create response with pagination info
            Map<String, Object> response = new HashMap<>();
            response.put("users", userDTOs);
            response.put("currentPage", usersPage.getNumber());
            response.put("totalItems", usersPage.getTotalElements());
            response.put("totalPages", usersPage.getTotalPages());
            response.put("pageSize", usersPage.getSize());

            return ResponseEntity.ok(response);
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

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email is required"
                ));
            }

            if (code == null || code.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Verification code is required"
                ));
            }

            // Check rate limiting
            try {
                rateLimitService.checkVerificationAttempt(email);
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "success", false,
                        "message", e.getMessage()
                ));
            }

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            User user = userOpt.get();

            // Check if already verified
            if (Boolean.TRUE.equals(user.getEmailVerified())) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Email already verified"
                ));
            }

            // Check if token is expired
            if (user.getVerificationTokenExpiry() != null &&
                user.getVerificationTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Verification code has expired. Please request a new one."
                ));
            }

            // Validate verification code
            if (code.equals(user.getEmailVerificationToken())) {
                user.setEmailVerified(true);
                user.setEmailVerificationToken(null); // Invalidate token after use
                userService.save(user);

                // Reset rate limit attempts after successful verification
                rateLimitService.resetAttempts(email);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Email successfully verified"
                ));
            }

            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid verification code"
            ));
        } catch (Exception e) {
            log.error("Email verification error", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Verification failed: " + e.getMessage()
            ));
        }
    }


    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email is required"
                ));
            }

            // Check resend cooldown
            try {
                rateLimitService.checkResendCooldown(email);
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "success", false,
                        "message", e.getMessage()
                ));
            }

            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            User user = userOpt.get();

            if (Boolean.TRUE.equals(user.getEmailVerified())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email already verified"
                ));
            }

            // Resend verification email
            userService.sendEmailVerification(email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Verification code sent successfully"
            ));
        } catch (Exception e) {
            log.error("Resend verification error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Failed to resend verification code"
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
            email = email != null ? email.trim().toLowerCase() : null;
            String phoneNumber = request.get("phoneNumber");
            String normalizedPhoneNumber = phoneNumber != null ? phoneNumber.replaceAll("\\s+", "") : null;
            String password = request.get("password");
            password = password != null ? password.trim() : null;

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "errorCode", "EMAIL_REQUIRED",
                        "message", "Email is required"
                ));
            }

            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "errorCode", "PASSWORD_REQUIRED",
                        "message", "Password is required"
                ));
            }

            if (userService.existsByEmail(email)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "success", false,
                        "errorCode", "EMAIL_ALREADY_EXISTS",
                        "message", "An account with this email already exists"
                ));
            }

            if (normalizedPhoneNumber != null && !normalizedPhoneNumber.trim().isEmpty() &&
                    userService.existsByPhoneNumber(normalizedPhoneNumber)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "success", false,
                        "errorCode", "PHONE_ALREADY_EXISTS",
                        "message", "An account with this phone number already exists"
                ));
            }

            User user = userService.createUser(firstName, lastName, email, normalizedPhoneNumber, password);

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
                    "errorCode", "REGISTRATION_FAILED",
                    "message", e.getMessage()
            ));
        }
    }


    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('CAN_DELETE_USERS')")
    public ResponseEntity<Map<String, Object>> deactivateUser(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            log.info("Admin {} deactivating user with ID: {}", currentUser.getEmail(), id);

            // Prevent self-deactivation
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Cannot deactivate your own account"
                ));
            }

            User user = userService.deactivateUser(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User deactivated successfully",
                    "user", UserMapper.toResponseDTO(user)
            ));
        } catch (RuntimeException e) {
            log.error("Error deactivating user with ID: {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error deactivating user with ID: {}", id, e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to deactivate user"
            ));
        }
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('CAN_DELETE_USERS')")
    public ResponseEntity<Map<String, Object>> activateUser(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            log.info("Admin {} activating user with ID: {}", currentUser.getEmail(), id);

            User user = userService.activateUser(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User activated successfully",
                    "user", UserMapper.toResponseDTO(user)
            ));
        } catch (RuntimeException e) {
            log.error("Error activating user with ID: {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error activating user with ID: {}", id, e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to activate user"
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_USERS')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            log.info("Admin {} deleting user with ID: {}", currentUser.getEmail(), id);

            // Prevent self-deletion
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Cannot delete your own account"
                ));
            }

            userService.deleteUser(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User deleted successfully"
            ));
        } catch (RuntimeException e) {
            log.error("Error deleting user with ID: {}", id, e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error deleting user with ID: {}", id, e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to delete user"
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