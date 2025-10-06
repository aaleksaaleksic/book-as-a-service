package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.BookAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookAnalyticsRepository extends JpaRepository<BookAnalytics, Long> {

    Optional<BookAnalytics> findByBookAndAnalyticsDate(Book book, LocalDate date);

    List<BookAnalytics> findByBookOrderByAnalyticsDateDesc(Book book);

    @Query("SELECT ba FROM BookAnalytics ba WHERE ba.analyticsDate BETWEEN :startDate AND :endDate ORDER BY ba.analyticsDate DESC")
    List<BookAnalytics> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT ba.book.id, COALESCE(SUM(ba.dailyClicks), 0) FROM BookAnalytics ba " +
            "WHERE ba.analyticsDate BETWEEN :startDate AND :endDate GROUP BY ba.book.id ORDER BY SUM(ba.dailyClicks) DESC")
    List<Object[]> getMostClickedBooks(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT ba.book.id, COALESCE(SUM(ba.dailyReadingMinutes), 0) FROM BookAnalytics ba " +
            "WHERE ba.analyticsDate BETWEEN :startDate AND :endDate GROUP BY ba.book.id ORDER BY SUM(ba.dailyReadingMinutes) DESC")
    List<Object[]> getMostReadBooks(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(ba.dailyClicks), 0) FROM BookAnalytics ba WHERE ba.analyticsDate = :date")
    Long getTotalClicksForDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(ba.dailyReadingMinutes), 0) FROM BookAnalytics ba WHERE ba.analyticsDate = :date")
    Long getTotalReadingMinutesForDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(ba.dailyUniqueReaders), 0) FROM BookAnalytics ba WHERE ba.analyticsDate = :date")
    Long getTotalUniqueReadersForDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(ba.dailyClicks), 0) FROM BookAnalytics ba WHERE ba.analyticsDate BETWEEN :startDate AND :endDate")
    Long getTotalClicksBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Publisher-based analytics
    @Query("SELECT ba.book.publisher.id, ba.book.publisher.name, COALESCE(SUM(ba.dailyClicks), 0) " +
           "FROM BookAnalytics ba " +
           "WHERE ba.analyticsDate BETWEEN :startDate AND :endDate " +
           "GROUP BY ba.book.publisher.id, ba.book.publisher.name " +
           "ORDER BY SUM(ba.dailyClicks) DESC")
    List<Object[]> getClicksByPublisher(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT ba.book.publisher.id, ba.book.publisher.name, COALESCE(SUM(ba.dailyReadingMinutes), 0) " +
           "FROM BookAnalytics ba " +
           "WHERE ba.analyticsDate BETWEEN :startDate AND :endDate " +
           "GROUP BY ba.book.publisher.id, ba.book.publisher.name " +
           "ORDER BY SUM(ba.dailyReadingMinutes) DESC")
    List<Object[]> getReadingMinutesByPublisher(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT ba.book.publisher.id, ba.book.publisher.name, COUNT(DISTINCT ba.book.id) " +
           "FROM BookAnalytics ba " +
           "WHERE ba.analyticsDate BETWEEN :startDate AND :endDate " +
           "GROUP BY ba.book.publisher.id, ba.book.publisher.name " +
           "ORDER BY COUNT(DISTINCT ba.book.id) DESC")
    List<Object[]> getActiveBooksCountByPublisher(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Last 30 days analytics
    @Query("SELECT ba FROM BookAnalytics ba WHERE ba.analyticsDate >= :startDate ORDER BY ba.analyticsDate DESC")
    List<BookAnalytics> findLast30Days(@Param("startDate") LocalDate startDate);

    @Query("SELECT ba.book.id, ba.book.title, ba.book.author, COALESCE(SUM(ba.dailyClicks), 0) " +
           "FROM BookAnalytics ba " +
           "WHERE ba.analyticsDate >= :startDate " +
           "GROUP BY ba.book.id, ba.book.title, ba.book.author " +
           "ORDER BY SUM(ba.dailyClicks) DESC")
    List<Object[]> getMostClickedBooksLast30Days(@Param("startDate") LocalDate startDate);
}