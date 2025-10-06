package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByIsAvailableTrueOrderByCreatedAtDesc();
    List<Book> findAllByOrderByCreatedAtDesc();
    List<Book> findByIsAvailableTrueAndIsPremiumFalseOrderByCreatedAtDesc();
    List<Book> findByIsAvailableTrueAndIsPremiumTrueOrderByCreatedAtDesc();
    List<Book> findByCategoryAndIsAvailableTrueOrderByTitle(Category category);
    List<Book> findByAuthorContainingIgnoreCaseAndIsAvailableTrue(String author);

    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND " +
            "(LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.author) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY " +
            "  CASE WHEN LOWER(b.title) LIKE LOWER(CONCAT(:searchTerm, '%')) THEN 1 " +
            "       WHEN LOWER(b.author) LIKE LOWER(CONCAT(:searchTerm, '%')) THEN 2 " +
            "       ELSE 3 END, " +
            "  b.totalReads DESC, b.averageRating DESC")
    List<Book> searchBooks(@Param("searchTerm") String searchTerm);

    @Query("SELECT DISTINCT c FROM Category c JOIN Book b ON b.category = c WHERE b.isAvailable = true ORDER BY c.name")
    List<Category> findDistinctCategories();

    @Query(value = "SELECT * FROM books WHERE is_available = true " +
            "ORDER BY total_reads DESC NULLS LAST LIMIT 10",
            nativeQuery = true)
    List<Book> findTop10ByIsAvailableTrueOrderByTotalReadsDesc();

    @Query(value = "SELECT * FROM books WHERE is_available = true " +
            "ORDER BY average_rating DESC NULLS LAST LIMIT 10",
            nativeQuery = true)
    List<Book> findTop10ByIsAvailableTrueOrderByAverageRatingDesc();

    @Query(value = "SELECT * FROM books WHERE is_available = true " +
            "AND ratings_count > 0 " +
            "ORDER BY average_rating DESC, ratings_count DESC LIMIT 10",
            nativeQuery = true)
    List<Book> findTop10RatedBooksWithReviews();

    @Query(value = "SELECT * FROM books WHERE is_available = true " +
            "AND total_reads > 0 " +
            "ORDER BY total_reads DESC, average_rating DESC LIMIT 20",
            nativeQuery = true)
    List<Book> findTop20MostReadBooks();

    @Query(value = "SELECT * FROM books WHERE is_available = true " +
            "AND created_at >= CURRENT_DATE - INTERVAL '30 days' " +
            "ORDER BY total_reads DESC LIMIT 10",
            nativeQuery = true)
    List<Book> findRecentPopularBooks();

    @Query("SELECT COUNT(b) FROM Book b WHERE b.isAvailable = true")
    Long countAvailableBooks();

    @Query("SELECT COUNT(b) FROM Book b WHERE b.isAvailable = true AND b.isPremium = true")
    Long countPremiumBooks();

    @Query("SELECT COUNT(b) FROM Book b WHERE b.isAvailable = true AND b.isPremium = false")
    Long countFreeBooks();

    @Query("SELECT COALESCE(SUM(b.totalReads), 0) FROM Book b WHERE b.isAvailable = true")
    Long getTotalReadsAcrossAllBooks();

    @Query("SELECT COALESCE(AVG(b.averageRating), 0) FROM Book b WHERE b.isAvailable = true AND b.ratingsCount > 0")
    Double getAverageRatingAcrossAllBooks();

    @Query("SELECT c.name, COUNT(b) FROM Book b JOIN b.category c WHERE b.isAvailable = true GROUP BY c.name ORDER BY COUNT(b) DESC")
    List<Object[]> getCategoryStatistics();

    @Query("SELECT b.author, COUNT(b), COALESCE(SUM(b.totalReads), 0) FROM Book b WHERE b.isAvailable = true GROUP BY b.author ORDER BY SUM(b.totalReads) DESC")
    List<Object[]> getAuthorStatistics();

    @Query(value = "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) " +
            "FROM books WHERE is_available = true " +
            "GROUP BY DATE_TRUNC('month', created_at) " +
            "ORDER BY month DESC LIMIT 12",
            nativeQuery = true)
    List<Object[]> getMonthlyBookCreationStats();

    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND b.id IN :bookIds")
    List<Book> findAvailableBooksByIds(@Param("bookIds") List<Long> bookIds);

    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND b.isPremium = false AND b.totalReads > 100 ORDER BY b.totalReads DESC")
    List<Book> findPopularFreeBooks();

    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND b.isPremium = true AND b.totalReads > 50 ORDER BY b.averageRating DESC")
    List<Book> findTopPremiumBooks();

    List<Book> findByIsAvailableTrueAndPromoChapterPathIsNotNullOrderByCreatedAtDesc();
}