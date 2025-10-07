package me.remontada.readify.repository;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.Bookmark;
import me.remontada.readify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    // Find bookmark by user and book
    Optional<Bookmark> findByUserAndBook(User user, Book book);

    // Find all bookmarks for a specific user ordered by most recent
    List<Bookmark> findByUserOrderByUpdatedAtDesc(User user);

    // Find the most recent bookmark for a user (for "Continue Reading" section)
    @Query("SELECT b FROM Bookmark b WHERE b.user = :user ORDER BY b.updatedAt DESC")
    List<Bookmark> findMostRecentBookmarkByUser(@Param("user") User user);

    // Check if user has a bookmark for a specific book
    boolean existsByUserAndBook(User user, Book book);

    // Delete bookmark by user and book
    void deleteByUserAndBook(User user, Book book);
}
