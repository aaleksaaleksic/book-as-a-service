package me.remontada.readify.dto.response;

import lombok.*;
import me.remontada.readify.model.Permission;

import java.time.LocalDateTime;
import java.util.Set;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class UserResponseDTO {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String phoneNumber;


    private String fullName;

    private String role;

    private Set<Permission> permissions;

    private Boolean emailVerified;

    private Boolean phoneVerified;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime lastLoginAt;

    private Boolean isVerified;

    private Boolean isFullyVerified;


    private Boolean isAdmin;


    private Boolean hasActiveSubscription;

}