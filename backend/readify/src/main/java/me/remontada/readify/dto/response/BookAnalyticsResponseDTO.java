package me.remontada.readify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookAnalyticsResponseDTO {

    private Long id;
    private LocalDate analyticsDate;
    private Long dailyClicks;
    private Long dailyReadingMinutes;
    private Long dailyUniqueReaders;
    private Long dailySessions;
    private LocalDateTime createdAt;

    private Long bookId;
    private String bookTitle;
    private String bookAuthor;

    private Double dailyReadingHours;
}