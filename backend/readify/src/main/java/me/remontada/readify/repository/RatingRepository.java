package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.Rating;
import me.remontada.readify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    // Find rating by user and book
    Optional<Rating> findByUserAndBook(User user, Book book);

    // Check if user has already rated a book
    boolean existsByUserAndBook(User user, Book book);

    // Find all ratings for a specific book
    List<Rating> findByBookOrderByCreatedAtDesc(Book book);

    // Find all ratings by a specific user
    List<Rating> findByUserOrderByCreatedAtDesc(User user);

    // Get average rating for a book
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Rating r WHERE r.book = :book")
    Double getAverageRatingByBook(@Param("book") Book book);

    // Get rating count for a book
    @Query("SELECT COUNT(r) FROM Rating r WHERE r.book = :book")
    Long getRatingCountByBook(@Param("book") Book book);

    // Get all ratings with reviews for a book (for displaying on book detail page)
    @Query("SELECT r FROM Rating r WHERE r.book = :book AND r.review IS NOT NULL AND r.review != '' ORDER BY r.createdAt DESC")
    List<Rating> findRatingsWithReviewsByBook(@Param("book") Book book);

    // Get top rated books
    @Query("SELECT r.book.id, AVG(r.rating) as avgRating, COUNT(r) as ratingCount " +
           "FROM Rating r " +
           "GROUP BY r.book.id " +
           "HAVING COUNT(r) >= :minRatings " +
           "ORDER BY AVG(r.rating) DESC, COUNT(r) DESC")
    List<Object[]> findTopRatedBooks(@Param("minRatings") int minRatings);
}
