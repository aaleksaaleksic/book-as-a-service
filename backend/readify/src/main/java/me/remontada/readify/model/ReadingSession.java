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
@Table(name = "reading_sessions")
public class ReadingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false, name = "session_start")
    private LocalDateTime sessionStart;

    @Column(name = "session_end")
    private LocalDateTime sessionEnd;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "pages_read")
    private Integer pagesRead = 0;

    @Column(name = "last_page_position")
    private Integer lastPagePosition = 1;

    @Column(name = "device_type")
    private String deviceType; // MOBILE, DESKTOP, TABLET

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(nullable = false, name = "session_active")
    private Boolean sessionActive = true;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActiveSession() {
        return sessionActive && sessionEnd == null;
    }

    public void endSession() {
        if (isActiveSession()) {
            this.sessionEnd = LocalDateTime.now();
            this.sessionActive = false;

            if (sessionStart != null) {
                this.durationMinutes = (int) java.time.Duration.between(sessionStart, sessionEnd).toMinutes();
            }
        }
    }

    public int getTotalMinutesRead() {
        if (sessionEnd != null && sessionStart != null) {
            return (int) java.time.Duration.between(sessionStart, sessionEnd).toMinutes();
        }
        return 0;
    }
}