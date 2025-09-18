package me.remontada.readify.mapper;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.BookResponseDTO;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@UtilityClass
@Slf4j
public class BookMapper {


    public static BookResponseDTO toResponseDTO(Book book) {
        if (book == null) {
            log.warn("Attempted to map null Book entity to DTO");
            return null;
        }

        try {
            return BookResponseDTO.builder()
                    .id(book.getId())
                    .title(book.getTitle())
                    .author(book.getAuthor())
                    .description(book.getDescription())
                    .isbn(book.getIsbn())
                    .category(book.getCategory())
                    .pages(book.getPages())
                    .language(book.getLanguage())
                    .publicationYear(book.getPublicationYear())

                    .price(book.getPrice())

                    .isPremium(book.getIsPremium())
                    .isAvailable(book.getIsAvailable())
                    .coverImageUrl(resolveCoverImageUrl(book))

                    .averageRating(safeGetBigDecimal(book.getAverageRating()))

                    .totalRatings(safeGetLong(book.getRatingsCount()))
                    .readCount(safeGetLong(book.getTotalReads()))

                    .createdAt(book.getCreatedAt())
                    .updatedAt(resolveUpdatedAt(book))

                    .contentUrl(deriveContentUrl(book))

                    .addedByName(extractUserFullName(book.getAddedBy()))
                    .addedById(extractUserId(book.getAddedBy()))
                    .build();

        } catch (Exception e) {
            log.error("Error mapping Book entity to DTO for book ID: {}", book.getId(), e);

            return BookResponseDTO.builder()
                    .id(book.getId())
                    .title(book.getTitle() != null ? book.getTitle() : "Unknown Title")
                    .author(book.getAuthor() != null ? book.getAuthor() : "Unknown Author")
                    .addedByName("Unknown")
                    .build();
        }
    }


    public static List<BookResponseDTO> toResponseDTOList(List<Book> books) {
        if (books == null) {
            return List.of();
        }

        return books.stream()
                .map(book -> {
                    try {
                        return toResponseDTO(book);
                    } catch (Exception e) {
                        log.error("Failed to map book ID: {}", book != null ? book.getId() : "null", e);
                        return null;
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    // =============================================================================
    // HELPER METHODS - Type-safe value extraction
    // =============================================================================


    private static BigDecimal safeGetBigDecimal(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }


    private static Long safeGetLong(Long value) {
        return value != null ? value : 0L;
    }


    private static LocalDateTime resolveUpdatedAt(Book book) {
        if (book == null) {
            return null;
        }

        LocalDateTime updatedAt = book.getUpdatedAt();
        return updatedAt != null ? updatedAt : book.getCreatedAt();
    }


    private static String deriveContentUrl(Book book) {
        if (book == null) {
            return null;
        }

        Long bookId = book.getId();
        String contentPath = book.getContentFilePath();

        if (bookId == null || contentPath == null || contentPath.isBlank()) {
            return null;
        }

        return String.format("/api/v1/files/books/%d/content", bookId);
    }

    private static String resolveCoverImageUrl(Book book) {
        if (book == null) {
            return null;
        }

        String coverPath = book.getCoverImageUrl();
        if (coverPath == null || coverPath.isBlank()) {
            return null;
        }

        String normalized = coverPath.replace("\\", "/");

        if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            return normalized;
        }

        if (normalized.startsWith("/api/")) {
            return normalized;
        }

        Long bookId = book.getId();
        if (bookId != null) {
            return String.format("/api/v1/files/covers/%d", bookId);
        }

        return normalized;
    }


    private static String extractUserFullName(User user) {
        if (user == null) {
            return "Unknown Author";
        }

        try {
            String firstName = user.getFirstName();
            String lastName = user.getLastName();

            if (firstName != null && lastName != null) {
                return firstName.trim() + " " + lastName.trim();
            } else if (firstName != null) {
                return firstName.trim();
            } else if (lastName != null) {
                return lastName.trim();
            } else {
                return "Unknown Author";
            }

        } catch (Exception e) {
            log.debug("Could not load user name for book mapping", e);
            return "Unknown Author";
        }
    }


    private static Long extractUserId(User user) {
        if (user == null) {
            return null;
        }

        try {
            return user.getId();
        } catch (Exception e) {
            log.debug("Could not load user ID for book mapping", e);
            return null;
        }
    }

    // =============================================================================
    // TYPE CONVERSION HELPERS for future use
    // =============================================================================


    public static Double bigDecimalToDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.0;
    }


    public static Integer longToInteger(Long value) {
        if (value == null) {
            return 0;
        }

        if (value > Integer.MAX_VALUE) {
            log.warn("Long value {} exceeds Integer.MAX_VALUE, clamping to max", value);
            return Integer.MAX_VALUE;
        }

        return value.intValue();
    }


    public static Integer parseIntegerSafely(String value, Integer defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }

        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Could not parse integer from string: {}", value);
            return defaultValue;
        }
    }
}