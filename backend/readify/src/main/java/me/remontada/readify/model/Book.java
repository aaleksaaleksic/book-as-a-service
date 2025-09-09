package me.remontada.readify.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String isbn;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Integer pages;

    @Column(nullable = false)
    private String language;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Boolean isPremium = false;

    @Column(nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "content_file_path")
    private String contentFilePath; // Encrypted path to book content

    @Column(name = "content_preview")
    private String contentPreview; // First few pages for preview

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by", nullable = false)
    private User addedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime updatedAt;

    // Reading statistics (will be used for analytics)
    @Column(name = "total_reads")
    private Long totalReads = 0L;

    @Column(name = "average_rating")
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "ratings_count")
    private Long ratingsCount = 0L;

    public String getFullTitle() {
        return title + " by " + author;
    }

    public boolean isPremiumBook() {
        return isPremium;
    }

    public boolean isAccessibleToUser(User user) {
        if (!isAvailable) return false;
        if (!isPremium) return true;

        // Premium books require subscription (we'll implement this logic later)
        return user.hasPermission(Permission.CAN_READ_PREMIUM_BOOKS);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}