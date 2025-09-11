package me.remontada.readify.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "book_analytics")
public class BookAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false, name = "analytics_date")
    private LocalDate analyticsDate;

    @Column(nullable = false, name = "daily_clicks")
    private Long dailyClicks = 0L;

    @Column(nullable = false, name = "daily_reading_minutes")
    private Long dailyReadingMinutes = 0L;

    @Column(nullable = false, name = "daily_unique_readers")
    private Long dailyUniqueReaders = 0L;

    @Column(nullable = false, name = "daily_sessions")
    private Long dailySessions = 0L;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void incrementClicks() {
        this.dailyClicks++;
    }

    public void addReadingMinutes(long minutes) {
        this.dailyReadingMinutes += minutes;
    }

    public void incrementSessions() {
        this.dailySessions++;
    }

    public void incrementUniqueReaders() {
        this.dailyUniqueReaders++;
    }
}