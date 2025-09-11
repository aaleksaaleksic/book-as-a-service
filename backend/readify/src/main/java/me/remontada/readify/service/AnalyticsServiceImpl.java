package me.remontada.readify.service;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.BookAnalytics;
import me.remontada.readify.model.ReadingSession;
import me.remontada.readify.model.User;
import me.remontada.readify.repository.BookAnalyticsRepository;
import me.remontada.readify.repository.BookRepository;
import me.remontada.readify.repository.ReadingSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsServiceImpl.class);

    private final ReadingSessionRepository readingSessionRepository;
    private final BookAnalyticsRepository bookAnalyticsRepository;
    private final BookRepository bookRepository;

    @Autowired
    public AnalyticsServiceImpl(ReadingSessionRepository readingSessionRepository,
                                BookAnalyticsRepository bookAnalyticsRepository,
                                BookRepository bookRepository) {
        this.readingSessionRepository = readingSessionRepository;
        this.bookAnalyticsRepository = bookAnalyticsRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    public ReadingSession startReadingSession(User user, Book book, String deviceType, String ipAddress) {

        Optional<ReadingSession> existingSession =
                readingSessionRepository.findByUserAndBookAndSessionActiveTrue(user, book);

        if (existingSession.isPresent()) {
            return existingSession.get();
        }

        ReadingSession session = new ReadingSession();
        session.setUser(user);
        session.setBook(book);
        session.setSessionStart(LocalDateTime.now());
        session.setDeviceType(deviceType);
        session.setIpAddress(ipAddress);
        session.setSessionActive(true);

        ReadingSession savedSession = readingSessionRepository.save(session);

        book.setTotalReads(book.getTotalReads() + 1);
        bookRepository.save(book);

        return savedSession;
    }

    @Override
    public ReadingSession endReadingSession(Long sessionId, Integer pagesRead) {

        ReadingSession session = readingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Reading session not found"));

        if (!session.isActiveSession()) {
            return session;
        }

        session.endSession();
        if (pagesRead != null) {
            session.setPagesRead(pagesRead);
        }

        return readingSessionRepository.save(session);
    }

    @Override
    public ReadingSession updateReadingProgress(Long sessionId, Integer currentPage) {
        ReadingSession session = readingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Reading session not found"));

        session.setLastPagePosition(currentPage);
        return readingSessionRepository.save(session);
    }

    @Override
    public void trackBookClick(Book book) {

        LocalDate today = LocalDate.now();
        BookAnalytics analytics = bookAnalyticsRepository
                .findByBookAndAnalyticsDate(book, today)
                .orElse(new BookAnalytics());

        if (analytics.getId() == null) {
            analytics.setBook(book);
            analytics.setAnalyticsDate(today);
        }

        analytics.incrementClicks();
        bookAnalyticsRepository.save(analytics);
    }

    @Override
    public List<ReadingSession> getUserReadingHistory(User user) {
        return readingSessionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public Long getTotalReadingTimeByUser(User user) {
        return readingSessionRepository.getTotalReadingTimeByUser(user);
    }

    @Override
    public Long getTotalReadingTimeByBook(Book book) {
        return readingSessionRepository.getTotalReadingTimeByBook(book);
    }

    @Override
    public List<Map<String, Object>> getMostReadBooks(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = bookAnalyticsRepository.getMostReadBooks(startDate, endDate);

        List<Map<String, Object>> books = new ArrayList<>();
        for (Object[] result : results) {
            Long bookId = (Long) result[0];
            Long totalMinutes = (Long) result[1];

            Optional<Book> book = bookRepository.findById(bookId);
            if (book.isPresent()) {
                books.add(Map.of(
                        "bookId", bookId,
                        "title", book.get().getTitle(),
                        "author", book.get().getAuthor(),
                        "totalReadingMinutes", totalMinutes,
                        "totalReadingHours", totalMinutes / 60.0
                ));
            }
        }

        return books;
    }

    @Override
    public List<Map<String, Object>> getMostPopularBooks(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = bookAnalyticsRepository.getMostClickedBooks(startDate, endDate);

        List<Map<String, Object>> books = new ArrayList<>();
        for (Object[] result : results) {
            Long bookId = (Long) result[0];
            Long totalClicks = (Long) result[1];

            Optional<Book> book = bookRepository.findById(bookId);
            if (book.isPresent()) {
                books.add(Map.of(
                        "bookId", bookId,
                        "title", book.get().getTitle(),
                        "author", book.get().getAuthor(),
                        "totalClicks", totalClicks,
                        "totalReads", book.get().getTotalReads()
                ));
            }
        }

        return books;
    }

    @Override
    public Map<String, Object> getDashboardAnalytics() {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);
        LocalDate monthAgo = today.minusDays(30);

        Long todayClicks = bookAnalyticsRepository.getTotalClicksForDate(today);
        Long todayReadingMinutes = bookAnalyticsRepository.getTotalReadingMinutesForDate(today);
        Long todayReaders = bookAnalyticsRepository.getTotalUniqueReadersForDate(today);

        List<Map<String, Object>> mostReadThisWeek = getMostReadBooks(weekAgo, today);
        List<Map<String, Object>> mostPopularThisMonth = getMostPopularBooks(monthAgo, today);

        return Map.of(
                "today", Map.of(
                        "totalClicks", todayClicks,
                        "totalReadingMinutes", todayReadingMinutes,
                        "totalReadingHours", todayReadingMinutes / 60.0,
                        "uniqueReaders", todayReaders
                ),
                "trends", Map.of(
                        "mostReadThisWeek", mostReadThisWeek.subList(0, Math.min(5, mostReadThisWeek.size())),
                        "mostPopularThisMonth", mostPopularThisMonth.subList(0, Math.min(5, mostPopularThisMonth.size()))
                )
        );
    }

    @Override
    public Map<String, Object> getBookAnalytics(Long bookId, LocalDate startDate, LocalDate endDate) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        Long totalReadingTime = getTotalReadingTimeByBook(book);
        Long uniqueReaders = readingSessionRepository.getUniqueReadersCount(book);
        Double averageSessionTime = readingSessionRepository.getAverageReadingTimeByBook(book);

        List<BookAnalytics> dailyAnalytics = bookAnalyticsRepository
                .findByDateRange(startDate, endDate).stream()
                .filter(ba -> ba.getBook().getId().equals(bookId))
                .toList();

        return Map.of(
                "book", Map.of(
                        "id", book.getId(),
                        "title", book.getTitle(),
                        "author", book.getAuthor(),
                        "totalReads", book.getTotalReads()
                ),
                "statistics", Map.of(
                        "totalReadingMinutes", totalReadingTime,
                        "totalReadingHours", totalReadingTime / 60.0,
                        "uniqueReaders", uniqueReaders,
                        "averageSessionMinutes", averageSessionTime != null ? averageSessionTime : 0.0
                ),
                "dailyAnalytics", dailyAnalytics.stream()
                        .map(da -> Map.of(
                                "date", da.getAnalyticsDate(),
                                "clicks", da.getDailyClicks(),
                                "readingMinutes", da.getDailyReadingMinutes(),
                                "uniqueReaders", da.getDailyUniqueReaders(),
                                "sessions", da.getDailySessions()
                        ))
                        .toList()
        );
    }

    @Override
    public List<Map<String, Object>> getTopReaders(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        List<Object[]> results = readingSessionRepository.getTopReadersByTime(startDateTime);

        return results.stream()
                .map(result -> Map.of(
                        "userId", result[0],
                        "totalReadingMinutes", result[1],
                        "totalReadingHours", ((Long) result[1]) / 60.0
                ))
                .toList();
    }

    @Override
    @Scheduled(cron = "0 30 1 * * ?")
    public void processDailyAnalytics() {
        LocalDate date = LocalDate.now().minusDays(1);

        logger.info("Processing daily analytics for date: {}", date);

        List<Book> allBooks = bookRepository.findAll();

        for (Book book : allBooks) {
            BookAnalytics analytics = bookAnalyticsRepository
                    .findByBookAndAnalyticsDate(book, date)
                    .orElse(new BookAnalytics());

            if (analytics.getId() == null) {
                analytics.setBook(book);
                analytics.setAnalyticsDate(date);
            }

            bookAnalyticsRepository.save(analytics);
        }

        logger.info("Daily analytics processing completed for: {}", date);
    }

    @Override
    @Scheduled(fixedRate = 1800000)
    public void cleanupStaleReadingSessions() {
        LocalDateTime timeout = LocalDateTime.now().minusHours(8); // 8 hours timeout
        List<ReadingSession> staleSessions = readingSessionRepository.findStaleActiveSessions(timeout);

        if (!staleSessions.isEmpty()) {
            logger.info("Cleaning up {} stale reading sessions", staleSessions.size());

            for (ReadingSession session : staleSessions) {
                session.endSession();
                readingSessionRepository.save(session);
            }
        }
    }
}