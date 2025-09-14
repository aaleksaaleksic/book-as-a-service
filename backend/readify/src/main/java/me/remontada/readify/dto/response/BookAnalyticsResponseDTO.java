package me.remontada.readify.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class BookAnalyticsResponseDTO {

    private Long id;

    private LocalDate analyticsDate;

    private Long dailyClicks;

    private Long dailyReadingMinutes;

    private Long dailyUniqueReaders;

    private Long dailySessions;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;



    private Long bookId;

    private String bookTitle;

    private String bookAuthor;

    private String bookIsbn;

    private String bookCategory;

    private Boolean bookIsPremium;

    private Boolean bookIsAvailable;



    private Double averageSessionDuration;


    private Double clickToReadConversionRate;


    private Double engagementScore;


    private String activitySummary;
}