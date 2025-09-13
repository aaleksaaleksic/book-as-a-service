package me.remontada.readify.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    @Column(nullable = false)
    private Boolean emailVerified = false;

    @Column(nullable = false)
    private Boolean phoneVerified = false;

    @Column
    private String emailVerificationToken;

    @Column
    private String phoneVerificationCode;

    @Column
    private LocalDateTime verificationTokenExpiry;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "permission")
    private Set<Permission> permissions;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime lastLoginAt;

    @Column(nullable = false)
    private Boolean active = true;

    public boolean hasPermission(Permission permission) {
        return permissions != null && permissions.contains(permission);
    }

    public boolean hasActiveSubscription() {
        // TODO: Implement proper subscription check when SubscriptionService is injected
        return hasPermission(Permission.CAN_READ_PREMIUM_BOOKS);
    }

    public String getFullName() {
        StringBuilder fullName = new StringBuilder();

        if (firstName != null && !firstName.trim().isEmpty()) {
            fullName.append(firstName.trim());
        }

        if (lastName != null && !lastName.trim().isEmpty()) {
            if (fullName.length() > 0) {
                fullName.append(" ");
            }
            fullName.append(lastName.trim());
        }

        return fullName.length() > 0 ? fullName.toString() : "Unknown User";
    }

    public boolean isVerified() {
        return Boolean.TRUE.equals(emailVerified) || Boolean.TRUE.equals(phoneVerified);
    }

    public boolean isFullyVerified() {
        return Boolean.TRUE.equals(emailVerified) && Boolean.TRUE.equals(phoneVerified);
    }


    public boolean isAdmin() {
        return hasPermission(Permission.CAN_CREATE_USERS) ||
                hasPermission(Permission.CAN_DELETE_USERS) ||
                hasPermission(Permission.CAN_VIEW_ANALYTICS);
    }


    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }
}