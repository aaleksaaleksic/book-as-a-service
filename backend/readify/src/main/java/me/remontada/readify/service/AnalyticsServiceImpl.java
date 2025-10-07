package me.remontada.readify.service;

import me.remontada.readify.model.*;
import me.remontada.readify.repository.BookAnalyticsRepository;
import me.remontada.readify.repository.BookRepository;
import me.remontada.readify.repository.ReadingSessionRepository;
import me.remontada.readify.repository.UserRepository;
import me.remontada.readify.repository.SubscriptionRepository;
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
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Autowired
    public AnalyticsServiceImpl(ReadingSessionRepository readingSessionRepository,
                                BookAnalyticsRepository bookAnalyticsRepository,
                                BookRepository bookRepository,
                                UserRepository userRepository,
                                SubscriptionRepository subscriptionRepository) {
        this.readingSessionRepository = readingSessionRepository;
        this.bookAnalyticsRepository = bookAnalyticsRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public ReadingSession startReadingSession(User user, Book book, String deviceType, String ipAddress) {

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();

        List<ReadingSession> activeSessions =
                readingSessionRepository.findByUserAndBookAndSessionActiveTrueOrderBySessionStartDesc(user, book);

        if (!activeSessions.isEmpty()) {
            ReadingSession activeSession = activeSessions.get(0);

            if (activeSessions.size() > 1) {
                logger.warn("Found {} active sessions for user {} and book {}. Closing duplicate sessions.",
                        activeSessions.size(), user.getId(), book.getId());

                activeSessions.stream().skip(1).forEach(session -> {
                    session.endSession();
                    readingSessionRepository.save(session);
                });
            }

            return activeSession;
        }

        // Check if this is the user's first session for this book today
        List<ReadingSession> todaySessions = readingSessionRepository
                .findByUserAndBookAndSessionStartAfter(user, book, todayStart);
        boolean isFirstSessionToday = todaySessions.isEmpty();

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

        // Track book click for analytics
        trackBookClick(book);

        // Track unique reader if this is their first session today
        if (isFirstSessionToday) {
            trackUniqueReader(book);
        }

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
            logger.info("Creating new BookAnalytics for book {} on date {}", book.getTitle(), today);
        }

        analytics.incrementClicks();
        bookAnalyticsRepository.save(analytics);
        logger.info("Tracked click for book: {} - Total clicks today: {}", book.getTitle(), analytics.getDailyClicks());
    }

    /**
     * Track unique reader for a book on the current day
     */
    private void trackUniqueReader(Book book) {
        LocalDate today = LocalDate.now();
        BookAnalytics analytics = bookAnalyticsRepository
                .findByBookAndAnalyticsDate(book, today)
                .orElse(new BookAnalytics());

        if (analytics.getId() == null) {
            analytics.setBook(book);
            analytics.setAnalyticsDate(today);
        }

        analytics.incrementUniqueReaders();
        bookAnalyticsRepository.save(analytics);
        logger.info("Tracked unique reader for book: {} - Total unique readers today: {}",
                book.getTitle(), analytics.getDailyUniqueReaders());
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
        LocalDate monthStart = today.withDayOfMonth(1);

        // User statistics
        long totalUsers = userRepository.countAllUsers();
        long subscribedUsers = userRepository.countUsersWithActiveSubscription();

        // Subscription statistics
        long totalActiveSubscriptions = subscriptionRepository.countActiveSubscriptions();
        List<Object[]> subscriptionsByType = subscriptionRepository.getActiveSubscriptionsByType();

        Map<String, Long> subscriptionCounts = new HashMap<>();
        for (Object[] result : subscriptionsByType) {
            SubscriptionType type = (SubscriptionType) result[0];
            Long count = (Long) result[1];
            subscriptionCounts.put(type.name(), count);
        }

        // Book statistics
        long totalBooks = bookRepository.count();

        // Click statistics for this month
        Long monthClicks = bookAnalyticsRepository.getTotalClicksBetweenDates(monthStart, today);

        // Last 30 days statistics
        LocalDate thirtyDaysAgo = today.minusDays(30);
        Long last30DaysClicks = bookAnalyticsRepository.getTotalClicksBetweenDates(thirtyDaysAgo, today);

        // Today's statistics
        Long todayClicks = bookAnalyticsRepository.getTotalClicksForDate(today);
        Long todayReadingMinutes = bookAnalyticsRepository.getTotalReadingMinutesForDate(today);
        Long todayReaders = bookAnalyticsRepository.getTotalUniqueReadersForDate(today);

        List<Map<String, Object>> mostReadThisWeek = getMostReadBooks(weekAgo, today);
        List<Map<String, Object>> mostPopularThisMonth = getMostPopularBooks(monthAgo, today);

        Map<String, Object> analytics = new HashMap<>();

        analytics.put("users", Map.of(
                "totalUsers", totalUsers,
                "subscribedUsers", subscribedUsers,
                "freeUsers", totalUsers - subscribedUsers
        ));

        analytics.put("subscriptions", Map.of(
                "totalActive", totalActiveSubscriptions,
                "monthly", subscriptionCounts.getOrDefault("MONTHLY", 0L),
                "sixMonth", subscriptionCounts.getOrDefault("SIX_MONTH", 0L),
                "yearly", subscriptionCounts.getOrDefault("YEARLY", 0L)
        ));

        analytics.put("books", Map.of(
                "totalBooks", totalBooks
        ));

        analytics.put("engagement", Map.of(
                "totalClicksThisMonth", monthClicks != null ? monthClicks : 0L,
                "totalClicksLast30Days", last30DaysClicks != null ? last30DaysClicks : 0L,
                "todayClicks", todayClicks != null ? todayClicks : 0L
        ));

        analytics.put("today", Map.of(
                "totalClicks", todayClicks != null ? todayClicks : 0L,
                "totalReadingMinutes", todayReadingMinutes != null ? todayReadingMinutes : 0L,
                "totalReadingHours", todayReadingMinutes != null ? todayReadingMinutes / 60.0 : 0.0,
                "uniqueReaders", todayReaders != null ? todayReaders : 0L
        ));

        analytics.put("trends", Map.of(
                "mostReadThisWeek", mostReadThisWeek.subList(0, Math.min(5, mostReadThisWeek.size())),
                "mostPopularThisMonth", mostPopularThisMonth.subList(0, Math.min(5, mostPopularThisMonth.size()))
        ));

        return analytics;
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

    @Override
    public List<Map<String, Object>> getClicksByPublisher(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = bookAnalyticsRepository.getClicksByPublisher(startDate, endDate);

        return results.stream()
                .map(result -> Map.of(
                        "publisherId", result[0],
                        "publisherName", result[1],
                        "totalClicks", result[2]
                ))
                .toList();
    }

    @Override
    public List<Map<String, Object>> getReadingMinutesByPublisher(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = bookAnalyticsRepository.getReadingMinutesByPublisher(startDate, endDate);

        return results.stream()
                .map(result -> Map.of(
                        "publisherId", result[0],
                        "publisherName", result[1],
                        "totalReadingMinutes", result[2],
                        "totalReadingHours", ((Long) result[2]) / 60.0
                ))
                .toList();
    }

    @Override
    public List<Map<String, Object>> getActiveBooksCountByPublisher(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = bookAnalyticsRepository.getActiveBooksCountByPublisher(startDate, endDate);

        return results.stream()
                .map(result -> Map.of(
                        "publisherId", result[0],
                        "publisherName", result[1],
                        "activeBooksCount", result[2]
                ))
                .toList();
    }

    @Override
    public List<Map<String, Object>> getMostClickedBooksLast30Days() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<Object[]> results = bookAnalyticsRepository.getMostClickedBooksLast30Days(thirtyDaysAgo);

        return results.stream()
                .map(result -> Map.of(
                        "bookId", result[0],
                        "title", result[1],
                        "author", result[2],
                        "totalClicks", result[3]
                ))
                .toList();
    }

    @Override
    public Map<String, Object> getPublisherAnalyticsSummary(Long publisherId, LocalDate startDate, LocalDate endDate) {
        // Get all analytics for books from this publisher
        List<BookAnalytics> publisherAnalytics = bookAnalyticsRepository.findByDateRange(startDate, endDate)
                .stream()
                .filter(ba -> ba.getBook().getPublisher().getId().equals(publisherId))
                .toList();

        long totalClicks = publisherAnalytics.stream()
                .mapToLong(BookAnalytics::getDailyClicks)
                .sum();

        long totalReadingMinutes = publisherAnalytics.stream()
                .mapToLong(BookAnalytics::getDailyReadingMinutes)
                .sum();

        long uniqueBooks = publisherAnalytics.stream()
                .map(ba -> ba.getBook().getId())
                .distinct()
                .count();

        return Map.of(
                "publisherId", publisherId,
                "totalClicks", totalClicks,
                "totalReadingMinutes", totalReadingMinutes,
                "totalReadingHours", totalReadingMinutes / 60.0,
                "uniqueBooksRead", uniqueBooks,
                "period", Map.of(
                        "startDate", startDate,
                        "endDate", endDate
                )
        );
    }
}