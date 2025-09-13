package me.remontada.readify.mapper;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.ReadingSessionResponseDTO;
import me.remontada.readify.model.ReadingSession;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;

@UtilityClass
@Slf4j
public class ReadingSessionMapper {

    public static ReadingSessionResponseDTO toResponseDTO(ReadingSession session) {
        if (session == null) {
            return null;
        }

        try {
            return ReadingSessionResponseDTO.builder()
                    .id(session.getId())
                    .sessionStart(session.getSessionStart())
                    .sessionEnd(session.getSessionEnd())
                    .durationMinutes(session.getDurationMinutes())
                    .pagesRead(session.getPagesRead())
                    .lastPagePosition(session.getLastPagePosition())
                    .deviceType(session.getDeviceType())
                    .sessionActive(session.getSessionActive())
                    .createdAt(session.getCreatedAt())

                    .bookId(extractBookId(session.getBook()))
                    .bookTitle(extractBookTitle(session.getBook()))
                    .bookAuthor(extractBookAuthor(session.getBook()))
                    .userId(extractUserId(session.getUser()))
                    .userEmail(extractUserEmail(session.getUser()))
                    .userName(extractUserName(session.getUser()))

                    .totalMinutesRead(session.getTotalMinutesRead())
                    .isActiveSession(session.isActiveSession())
                    .build();

        } catch (Exception e) {
            log.error("Error mapping ReadingSession to DTO for ID: {}", session.getId(), e);
            return createFallbackDTO(session);
        }
    }

    private static Long extractBookId(Book book) {
        try {
            return book != null ? book.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String extractBookTitle(Book book) {
        try {
            return book != null ? book.getTitle() : "Unknown Book";
        } catch (Exception e) {
            return "Unknown Book";
        }
    }

    private static String extractBookAuthor(Book book) {
        try {
            return book != null ? book.getAuthor() : "Unknown Author";
        } catch (Exception e) {
            return "Unknown Author";
        }
    }

    private static Long extractUserId(User user) {
        try {
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String extractUserEmail(User user) {
        try {
            return user != null ? user.getEmail() : "unknown@example.com";
        } catch (Exception e) {
            return "unknown@example.com";
        }
    }

    private static String extractUserName(User user) {
        try {
            return user != null ? user.getFullName() : "Unknown User";
        } catch (Exception e) {
            return "Unknown User";
        }
    }

    private static ReadingSessionResponseDTO createFallbackDTO(ReadingSession session) {
        return ReadingSessionResponseDTO.builder()
                .id(session.getId())
                .sessionStart(session.getSessionStart())
                .bookTitle("Unknown Book")
                .userName("Unknown User")
                .build();
    }
}