package me.remontada.readify.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "verification_attempts")
public class VerificationAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Integer attemptCount = 0;

    @Column(nullable = false)
    private LocalDateTime lastAttemptAt;

    @Column(nullable = false)
    private LocalDateTime windowStartAt;

    public void incrementAttempts() {
        this.attemptCount++;
        this.lastAttemptAt = LocalDateTime.now();
    }

    public void resetAttempts() {
        this.attemptCount = 0;
        this.windowStartAt = LocalDateTime.now();
        this.lastAttemptAt = LocalDateTime.now();
    }

    public boolean isWindowExpired(int windowMinutes) {
        return windowStartAt.plusMinutes(windowMinutes).isBefore(LocalDateTime.now());
    }
}
