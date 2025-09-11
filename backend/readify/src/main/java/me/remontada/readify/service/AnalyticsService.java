package me.remontada.readify.service;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.ReadingSession;
import me.remontada.readify.model.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AnalyticsService {

    ReadingSession startReadingSession(User user, Book book, String deviceType, String ipAddress);

    ReadingSession endReadingSession(Long sessionId, Integer pagesRead);

    ReadingSession updateReadingProgress(Long sessionId, Integer currentPage);

    void trackBookClick(Book book);

    List<ReadingSession> getUserReadingHistory(User user);

    Long getTotalReadingTimeByUser(User user);

    Long getTotalReadingTimeByBook(Book book);

    List<Map<String, Object>> getMostReadBooks(LocalDate startDate, LocalDate endDate);

    List<Map<String, Object>> getMostPopularBooks(LocalDate startDate, LocalDate endDate);

    Map<String, Object> getDashboardAnalytics();

    Map<String, Object> getBookAnalytics(Long bookId, LocalDate startDate, LocalDate endDate);

    List<Map<String, Object>> getTopReaders(LocalDate startDate, LocalDate endDate);

    void processDailyAnalytics();

    void cleanupStaleReadingSessions();
}