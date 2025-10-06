package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.ReadingSession;
import me.remontada.readify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {

    List<ReadingSession> findByUserAndBookAndSessionActiveTrueOrderBySessionStartDesc(User user, Book book);

    List<ReadingSession> findByUserOrderByCreatedAtDesc(User user);

    List<ReadingSession> findByBookOrderByCreatedAtDesc(Book book);

    @Query("SELECT rs FROM ReadingSession rs WHERE rs.user = :user AND rs.book = :book ORDER BY rs.createdAt DESC")
    List<ReadingSession> findUserBookHistory(@Param("user") User user, @Param("book") Book book);

    @Query("SELECT COALESCE(SUM(rs.durationMinutes), 0) FROM ReadingSession rs WHERE rs.user = :user")
    Long getTotalReadingTimeByUser(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(rs.durationMinutes), 0) FROM ReadingSession rs WHERE rs.book = :book")
    Long getTotalReadingTimeByBook(@Param("book") Book book);

    @Query("SELECT rs.book.id, COALESCE(SUM(rs.durationMinutes), 0) FROM ReadingSession rs " +
            "WHERE rs.sessionStart >= :startDate GROUP BY rs.book.id ORDER BY SUM(rs.durationMinutes) DESC")
    List<Object[]> getMostReadBooksByTime(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT rs.book.id, COUNT(DISTINCT rs.user.id) FROM ReadingSession rs " +
            "WHERE rs.sessionStart >= :startDate GROUP BY rs.book.id ORDER BY COUNT(DISTINCT rs.user.id) DESC")
    List<Object[]> getMostPopularBooksByReaders(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(DISTINCT rs.user.id) FROM ReadingSession rs WHERE rs.book = :book")
    Long getUniqueReadersCount(@Param("book") Book book);

    @Query("SELECT rs FROM ReadingSession rs WHERE rs.sessionActive = true AND rs.sessionStart < :timeout")
    List<ReadingSession> findStaleActiveSessions(@Param("timeout") LocalDateTime timeout);

    @Query("SELECT rs.user.id, COALESCE(SUM(rs.durationMinutes), 0) FROM ReadingSession rs " +
            "WHERE rs.sessionStart >= :startDate GROUP BY rs.user.id ORDER BY SUM(rs.durationMinutes) DESC")
    List<Object[]> getTopReadersByTime(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(AVG(rs.durationMinutes), 0) FROM ReadingSession rs WHERE rs.book = :book AND rs.sessionEnd IS NOT NULL")
    Double getAverageReadingTimeByBook(@Param("book") Book book);

    @Query("SELECT rs FROM ReadingSession rs WHERE rs.user = :user AND rs.book = :book AND rs.sessionStart >= :startDate")
    List<ReadingSession> findByUserAndBookAndSessionStartAfter(@Param("user") User user, @Param("book") Book book, @Param("startDate") LocalDateTime startDate);
}