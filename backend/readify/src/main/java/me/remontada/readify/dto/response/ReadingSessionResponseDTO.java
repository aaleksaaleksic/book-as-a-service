package me.remontada.readify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadingSessionResponseDTO {

    private Long id;
    private LocalDateTime sessionStart;
    private LocalDateTime sessionEnd;
    private Integer durationMinutes;
    private Integer pagesRead;
    private Integer lastPagePosition;
    private String deviceType;
    private Boolean sessionActive;
    private LocalDateTime createdAt;

    private Long bookId;
    private String bookTitle;
    private String bookAuthor;

    private Long userId;
    private String userEmail;
    private String userName;

    private Integer totalMinutesRead;
    private Boolean isActiveSession;
}