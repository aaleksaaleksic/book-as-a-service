package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // Basic queries
    List<Book> findByIsAvailableTrueOrderByCreatedAtDesc();
    List<Book> findByIsAvailableTrueAndIsPremiumFalseOrderByCreatedAtDesc();
    List<Book> findByIsAvailableTrueAndIsPremiumTrueOrderByCreatedAtDesc();
    List<Book> findByCategoryAndIsAvailableTrueOrderByTitle(String category);
    List<Book> findByAuthorContainingIgnoreCaseAndIsAvailableTrue(String author);

    // Search query
    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND " +
            "(LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.author) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY b.createdAt DESC")
    List<Book> searchBooks(@Param("searchTerm") String searchTerm);

    @Query("SELECT DISTINCT b.category FROM Book b WHERE b.isAvailable = true ORDER BY b.category")
    List<String> findDistinctCategories();

    // FIXED: Analytics queries - correct field names
    @Query("SELECT b FROM Book b WHERE b.isAvailable = true ORDER BY b.totalReads DESC")
    List<Book> findTop10ByIsAvailableTrueOrderByTotalReadsDesc();

    @Query("SELECT b FROM Book b WHERE b.isAvailable = true ORDER BY b.averageRating DESC")
    List<Book> findTop10ByIsAvailableTrueOrderByAverageRatingDesc();

    // Additional useful queries
    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND b.ratingsCount > 0 ORDER BY b.averageRating DESC")
    List<Book> findTop10RatedBooksWithReviews();

    @Query("SELECT COUNT(b) FROM Book b WHERE b.isAvailable = true")
    Long countAvailableBooks();

    @Query("SELECT COUNT(b) FROM Book b WHERE b.isAvailable = true AND b.isPremium = true")
    Long countPremiumBooks();

    @Query("SELECT SUM(b.totalReads) FROM Book b WHERE b.isAvailable = true")
    Long getTotalReadsAcrossAllBooks();
}