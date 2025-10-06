package me.remontada.readify.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"addedBy"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String author;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "publisher_id", nullable = false)
    private Publisher publisher;

    @Column(nullable = false)
    private Integer pages;

    @Column(nullable = false, length = 50)
    private String language;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, name = "is_premium")
    @Builder.Default
    private Boolean isPremium = true;

    @Column(nullable = false, name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "content_file_path", length = 500)
    private String contentFilePath; // Encrypted path to book content

    @Column(name = "promo_chapter_path", length = 500)
    private String promoChapterPath; // Path to promo chapter PDF for non-subscribed users

    @Column(name = "content_preview", length = 5000)
    private String contentPreview; // First few pages for preview

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "permissions", "roles"})
    private User addedBy;

    @Column(nullable = false, name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "total_reads")
    @Builder.Default
    private Long totalReads = 0L;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "ratings_count")
    @Builder.Default
    private Long ratingsCount = 0L;

    public String getFullTitle() {
        return title + " by " + author;
    }

    public boolean isPremiumBook() {
        return Boolean.TRUE.equals(isPremium);
    }

    public boolean isAvailableBook() {
        return Boolean.TRUE.equals(isAvailable);
    }


    public boolean isAccessibleToUser(User user) {
        if (!isAvailableBook()) {
            return false;
        }

        if (!isPremiumBook()) {
            return true;
        }

        return user != null && user.hasActiveSubscription();
    }

    public boolean hasPromoChapter() {
        return promoChapterPath != null && !promoChapterPath.isBlank();
    }


    public void incrementReadCount() {
        this.totalReads = (this.totalReads != null ? this.totalReads : 0L) + 1L;
    }


    public void updateRating(BigDecimal newRating, BigDecimal currentTotalRating) {
        if (newRating == null || newRating.compareTo(BigDecimal.ONE) < 0 || newRating.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        this.ratingsCount = (this.ratingsCount != null ? this.ratingsCount : 0L) + 1L;

        BigDecimal totalRating = currentTotalRating.add(newRating);
        this.averageRating = totalRating.divide(BigDecimal.valueOf(this.ratingsCount), 2, BigDecimal.ROUND_HALF_UP);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.totalReads == null) {
            this.totalReads = 0L;
        }
        if (this.averageRating == null) {
            this.averageRating = BigDecimal.ZERO;
        }
        if (this.ratingsCount == null) {
            this.ratingsCount = 0L;
        }
    }
}