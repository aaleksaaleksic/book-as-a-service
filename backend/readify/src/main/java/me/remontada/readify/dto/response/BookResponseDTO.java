package me.remontada.readify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponseDTO {

    private Long id;
    private String title;
    private String author;
    private String description;
    private String isbn;
    private String category;
    private String publisher;
    private Integer pages;
    private String language;
    private Integer publicationYear;
    private BigDecimal price;
    private Boolean isPremium;
    private Boolean isAvailable;
    private String coverImageUrl;

    private BigDecimal averageRating;

    private Long totalRatings;

    private Long readCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String contentUrl;

    private String addedByName;
    private Long addedById;
}