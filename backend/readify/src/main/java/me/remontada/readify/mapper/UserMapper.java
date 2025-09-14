package me.remontada.readify.mapper;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.UserMinimalDTO;
import me.remontada.readify.dto.response.UserResponseDTO;
import me.remontada.readify.model.Permission;
import me.remontada.readify.model.User;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@UtilityClass
@Slf4j
public class UserMapper {


    public static UserResponseDTO toResponseDTO(User user) {
        if (user == null) {
            return null;
        }

        try {
            return UserResponseDTO.builder()
                    .id(extractId(user))
                    .firstName(extractFirstName(user))
                    .lastName(extractLastName(user))
                    .email(extractEmail(user))
                    .phoneNumber(extractPhoneNumber(user))
                    .fullName(extractFullName(user))
                    .permissions(extractPermissions(user))
                    .emailVerified(extractEmailVerified(user))
                    .phoneVerified(extractPhoneVerified(user))
                    .active(extractActive(user))
                    .createdAt(extractCreatedAt(user))
                    .lastLoginAt(extractLastLoginAt(user))

                    .isVerified(computeIsVerified(user))
                    .isFullyVerified(computeIsFullyVerified(user))
                    .isAdmin(computeIsAdmin(user))
                    .hasActiveSubscription(computeHasActiveSubscription(user))
                    .build();

        } catch (Exception e) {
            log.error("Error mapping User to ResponseDTO for ID: {}", user.getId(), e);
            return createFallbackResponseDTO(user);
        }
    }


    public static UserMinimalDTO toMinimalDTO(User user) {
        if (user == null) {
            return null;
        }

        try {
            return UserMinimalDTO.builder()
                    .id(extractId(user))
                    .fullName(extractFullName(user))
                    .email(extractEmail(user))
                    .active(extractActive(user))
                    .build();

        } catch (Exception e) {
            log.error("Error mapping User to MinimalDTO for ID: {}", extractId(user), e);
            return createFallbackMinimalDTO(user);
        }
    }


    public static List<UserResponseDTO> toResponseDTOList(List<User> users) {
        if (users == null) {
            return List.of();
        }

        return users.stream()
                .map(UserMapper::toResponseDTO)
                .collect(Collectors.toList());
    }


    public static List<UserMinimalDTO> toMinimalDTOList(List<User> users) {
        if (users == null) {
            return List.of();
        }

        return users.stream()
                .map(UserMapper::toMinimalDTO)
                .collect(Collectors.toList());
    }


    private static Long extractId(User user) {
        try {
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            log.warn("Failed to extract ID from User", e);
            return null;
        }
    }

    private static String extractFirstName(User user) {
        try {
            return user != null ? user.getFirstName() : "Unknown";
        } catch (Exception e) {
            log.warn("Failed to extract firstName from User", e);
            return "Unknown";
        }
    }

    private static String extractLastName(User user) {
        try {
            return user != null ? user.getLastName() : "";
        } catch (Exception e) {
            log.warn("Failed to extract lastName from User", e);
            return "";
        }
    }

    private static String extractEmail(User user) {
        try {
            return user != null ? user.getEmail() : "unknown@example.com";
        } catch (Exception e) {
            log.warn("Failed to extract email from User", e);
            return "unknown@example.com";
        }
    }

    private static String extractPhoneNumber(User user) {
        try {
            return user != null ? user.getPhoneNumber() : null;
        } catch (Exception e) {
            log.warn("Failed to extract phoneNumber from User", e);
            return null;
        }
    }

    private static String extractFullName(User user) {
        try {
            return user != null ? user.getFullName() : "Unknown User";
        } catch (Exception e) {
            log.warn("Failed to extract fullName from User", e);
            try {
                String firstName = extractFirstName(user);
                String lastName = extractLastName(user);
                return firstName + (lastName != null && !lastName.isEmpty() ? " " + lastName : "");
            } catch (Exception e2) {
                return "Unknown User";
            }
        }
    }

    private static Set<Permission> extractPermissions(User user) {
        try {
            return user != null ? user.getPermissions() : Set.of();
        } catch (Exception e) {
            log.warn("Failed to extract permissions from User", e);
            return Set.of();
        }
    }

    private static Boolean extractEmailVerified(User user) {
        try {
            return user != null ? user.getEmailVerified() : false;
        } catch (Exception e) {
            log.warn("Failed to extract emailVerified from User", e);
            return false;
        }
    }

    private static Boolean extractPhoneVerified(User user) {
        try {
            return user != null ? user.getPhoneVerified() : false;
        } catch (Exception e) {
            log.warn("Failed to extract phoneVerified from User", e);
            return false;
        }
    }

    private static Boolean extractActive(User user) {
        try {
            return user != null ? user.getActive() : false;
        } catch (Exception e) {
            log.warn("Failed to extract active status from User", e);
            return false;
        }
    }

    private static java.time.LocalDateTime extractCreatedAt(User user) {
        try {
            return user != null ? user.getCreatedAt() : null;
        } catch (Exception e) {
            log.warn("Failed to extract createdAt from User", e);
            return null;
        }
    }

    private static java.time.LocalDateTime extractLastLoginAt(User user) {
        try {
            return user != null ? user.getLastLoginAt() : null;
        } catch (Exception e) {
            log.warn("Failed to extract lastLoginAt from User", e);
            return null;
        }
    }


    private static Boolean computeIsVerified(User user) {
        try {
            return user != null ? user.isVerified() : false;
        } catch (Exception e) {
            log.warn("Failed to compute isVerified for User", e);
            return false;
        }
    }

    private static Boolean computeIsFullyVerified(User user) {
        try {
            return user != null ? user.isFullyVerified() : false;
        } catch (Exception e) {
            log.warn("Failed to compute isFullyVerified for User", e);
            return false;
        }
    }

    private static Boolean computeIsAdmin(User user) {
        try {
            return user != null ? user.isAdmin() : false;
        } catch (Exception e) {
            log.warn("Failed to compute isAdmin for User", e);
            return false;
        }
    }

    private static Boolean computeHasActiveSubscription(User user) {
        try {
            return user != null ? user.hasActiveSubscription() : false;
        } catch (Exception e) {
            log.warn("Failed to compute hasActiveSubscription for User", e);
            return false;
        }
    }


    private static UserResponseDTO createFallbackResponseDTO(User user) {
        Long safeId = null;
        try {
            safeId = user.getId();
        } catch (Exception ignored) {
        }

        return UserResponseDTO.builder()
                .id(safeId)
                .firstName("Unknown")
                .lastName("")
                .email("unknown@example.com")
                .phoneNumber(null)
                .fullName("Unknown User")
                .permissions(Set.of())
                .emailVerified(false)
                .phoneVerified(false)
                .active(false)
                .createdAt(null)
                .lastLoginAt(null)
                .isVerified(false)
                .isFullyVerified(false)
                .isAdmin(false)
                .hasActiveSubscription(false)
                .build();
    }

    private static UserMinimalDTO createFallbackMinimalDTO(User user) {
        Long safeId = null;
        try {
            safeId = user.getId();
        } catch (Exception ignored) {
            // ID extraction failed, proceed with null
        }

        return UserMinimalDTO.builder()
                .id(safeId)
                .fullName("Unknown User")
                .email("unknown@example.com")
                .active(false)
                .build();
    }
}