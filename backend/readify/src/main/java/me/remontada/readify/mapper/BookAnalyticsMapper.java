package me.remontada.readify.mapper;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.BookAnalyticsResponseDTO;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.BookAnalytics;

import java.util.List;
import java.util.stream.Collectors;


@UtilityClass
@Slf4j
public class BookAnalyticsMapper {


    public static BookAnalyticsResponseDTO toResponseDTO(BookAnalytics analytics) {
        if (analytics == null) {
            return null;
        }

        try {
            return BookAnalyticsResponseDTO.builder()
                    .id(analytics.getId())
                    .analyticsDate(analytics.getAnalyticsDate())
                    .dailyClicks(analytics.getDailyClicks())
                    .dailyReadingMinutes(analytics.getDailyReadingMinutes())
                    .dailyUniqueReaders(analytics.getDailyUniqueReaders())
                    .dailySessions(analytics.getDailySessions())
                    .createdAt(analytics.getCreatedAt())
                    .updatedAt(analytics.getUpdatedAt())

                    .bookId(extractBookId(analytics.getBook()))
                    .bookTitle(extractBookTitle(analytics.getBook()))
                    .bookAuthor(extractBookAuthor(analytics.getBook()))
                    .bookIsbn(extractBookIsbn(analytics.getBook()))
                    .bookCategory(extractBookCategory(analytics.getBook()))
                    .bookIsPremium(extractBookIsPremium(analytics.getBook()))
                    .bookIsAvailable(extractBookIsAvailable(analytics.getBook()))

                    .averageSessionDuration(computeAverageSessionDuration(analytics))
                    .clickToReadConversionRate(computeClickToReadConversionRate(analytics))
                    .engagementScore(computeEngagementScore(analytics))
                    .activitySummary(computeActivitySummary(analytics))
                    .build();

        } catch (Exception e) {
            log.error("Error mapping BookAnalytics to DTO for ID: {}", analytics.getId(), e);
            return createFallbackDTO(analytics);
        }
    }


    public static List<BookAnalyticsResponseDTO> toResponseDTOList(List<BookAnalytics> analyticsList) {
        if (analyticsList == null) {
            return List.of();
        }

        return analyticsList.stream()
                .map(BookAnalyticsMapper::toResponseDTO)
                .collect(Collectors.toList());
    }


    private static Long extractBookId(Book book) {
        try {
            return book != null ? book.getId() : null;
        } catch (Exception e) {
            log.warn("Failed to extract Book ID from BookAnalytics", e);
            return null;
        }
    }

    private static String extractBookTitle(Book book) {
        try {
            return book != null ? book.getTitle() : "Unknown Book";
        } catch (Exception e) {
            log.warn("Failed to extract Book title from BookAnalytics", e);
            return "Unknown Book";
        }
    }

    private static String extractBookAuthor(Book book) {
        try {
            return book != null ? book.getAuthor() : "Unknown Author";
        } catch (Exception e) {
            log.warn("Failed to extract Book author from BookAnalytics", e);
            return "Unknown Author";
        }
    }

    private static String extractBookIsbn(Book book) {
        try {
            return book != null ? book.getIsbn() : null;
        } catch (Exception e) {
            log.warn("Failed to extract Book ISBN from BookAnalytics", e);
            return null;
        }
    }

    private static String extractBookCategory(Book book) {
        try {
            return book != null ? book.getCategory() : "Uncategorized";
        } catch (Exception e) {
            log.warn("Failed to extract Book category from BookAnalytics", e);
            return "Uncategorized";
        }
    }

    private static Boolean extractBookIsPremium(Book book) {
        try {
            return book != null ? book.getIsPremium() : false;
        } catch (Exception e) {
            log.warn("Failed to extract Book isPremium from BookAnalytics", e);
            return false;
        }
    }

    private static Boolean extractBookIsAvailable(Book book) {
        try {
            return book != null ? book.getIsAvailable() : false;
        } catch (Exception e) {
            log.warn("Failed to extract Book isAvailable from BookAnalytics", e);
            return false;
        }
    }


    private static Double computeAverageSessionDuration(BookAnalytics analytics) {
        try {
            if (analytics == null || analytics.getDailySessions() == null || analytics.getDailySessions() == 0) {
                return 0.0;
            }

            Long sessions = analytics.getDailySessions();
            Long totalMinutes = analytics.getDailyReadingMinutes() != null ? analytics.getDailyReadingMinutes() : 0L;

            return sessions > 0 ? (double) totalMinutes / sessions : 0.0;
        } catch (Exception e) {
            log.warn("Failed to compute averageSessionDuration for BookAnalytics", e);
            return 0.0;
        }
    }

    private static Double computeClickToReadConversionRate(BookAnalytics analytics) {
        try {
            if (analytics == null || analytics.getDailyClicks() == null || analytics.getDailyClicks() == 0) {
                return 0.0;
            }

            Long clicks = analytics.getDailyClicks();
            Long sessions = analytics.getDailySessions() != null ? analytics.getDailySessions() : 0L;

            return clicks > 0 ? ((double) sessions / clicks) * 100.0 : 0.0;
        } catch (Exception e) {
            log.warn("Failed to compute clickToReadConversionRate for BookAnalytics", e);
            return 0.0;
        }
    }

    private static Double computeEngagementScore(BookAnalytics analytics) {
        try {
            if (analytics == null) {
                return 0.0;
            }



            Long clicks = analytics.getDailyClicks() != null ? analytics.getDailyClicks() : 0L;
            Long sessions = analytics.getDailySessions() != null ? analytics.getDailySessions() : 0L;
            Long readers = analytics.getDailyUniqueReaders() != null ? analytics.getDailyUniqueReaders() : 0L;
            Long minutes = analytics.getDailyReadingMinutes() != null ? analytics.getDailyReadingMinutes() : 0L;

            return (clicks * 1.0) + (sessions * 3.0) + (readers * 5.0) + (minutes * 0.1);
        } catch (Exception e) {
            log.warn("Failed to compute engagementScore for BookAnalytics", e);
            return 0.0;
        }
    }

    private static String computeActivitySummary(BookAnalytics analytics) {
        try {
            if (analytics == null) {
                return "No activity data";
            }

            Long clicks = analytics.getDailyClicks() != null ? analytics.getDailyClicks() : 0L;
            Long sessions = analytics.getDailySessions() != null ? analytics.getDailySessions() : 0L;
            Long readers = analytics.getDailyUniqueReaders() != null ? analytics.getDailyUniqueReaders() : 0L;
            Long minutes = analytics.getDailyReadingMinutes() != null ? analytics.getDailyReadingMinutes() : 0L;

            StringBuilder summary = new StringBuilder();

            if (readers > 0) {
                summary.append(readers).append(" reader").append(readers > 1 ? "s" : "");
            } else {
                summary.append("No readers");
            }

            if (minutes > 0) {
                long hours = minutes / 60;
                long remainingMinutes = minutes % 60;

                summary.append(" spent ");
                if (hours > 0) {
                    summary.append(hours).append("h ");
                }
                if (remainingMinutes > 0 || hours == 0) {
                    summary.append(remainingMinutes).append("m");
                }
                summary.append(" reading");
            }

            if (clicks > 0) {
                summary.append(" (").append(clicks).append(" click").append(clicks > 1 ? "s" : "").append(")");
            }

            return summary.toString();
        } catch (Exception e) {
            log.warn("Failed to compute activitySummary for BookAnalytics", e);
            return "Activity summary unavailable";
        }
    }


    private static BookAnalyticsResponseDTO createFallbackDTO(BookAnalytics analytics) {
        Long safeId = null;
        try {
            safeId = analytics.getId();
        } catch (Exception ignored) {
            // ID extraction failed - proceed with null
        }

        return BookAnalyticsResponseDTO.builder()
                .id(safeId)
                .analyticsDate(java.time.LocalDate.now())
                .dailyClicks(0L)
                .dailyReadingMinutes(0L)
                .dailyUniqueReaders(0L)
                .dailySessions(0L)
                .createdAt(null)
                .updatedAt(null)

                .bookId(null)
                .bookTitle("Unknown Book")
                .bookAuthor("Unknown Author")
                .bookIsbn(null)
                .bookCategory("Uncategorized")
                .bookIsPremium(false)
                .bookIsAvailable(false)

                .averageSessionDuration(0.0)
                .clickToReadConversionRate(0.0)
                .engagementScore(0.0)
                .activitySummary("Error loading analytics data")
                .build();
    }
}