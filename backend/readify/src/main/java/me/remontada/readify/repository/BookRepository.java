package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByIsAvailableTrueOrderByCreatedAtDesc();

    List<Book> findByIsAvailableTrueAndIsPremiumFalseOrderByCreatedAtDesc();

    List<Book> findByIsAvailableTrueAndIsPremiumTrueOrderByCreatedAtDesc();

    List<Book> findByCategoryAndIsAvailableTrueOrderByTitle(String category);

    List<Book> findByAuthorContainingIgnoreCaseAndIsAvailableTrue(String author);

    List<Book> findByTitleContainingIgnoreCaseAndIsAvailableTrue(String title);

    @Query("SELECT DISTINCT b.category FROM Book b WHERE b.isAvailable = true ORDER BY b.category")
    List<String> findDistinctCategories();

    @Query("SELECT b FROM Book b WHERE b.isAvailable = true AND " +
            "(LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.author) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(b.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY b.createdAt DESC")
    List<Book> searchBooks(@Param("searchTerm") String searchTerm);

    List<Book> findTop10ByIsAvailableTrueOrderByTotalReadsDesc();

    List<Book> findTop10ByIsAvailableTrueOrderByAverageRatingDesc();
}