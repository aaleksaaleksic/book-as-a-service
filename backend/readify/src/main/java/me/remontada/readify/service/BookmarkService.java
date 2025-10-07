package me.remontada.readify.service;

import me.remontada.readify.dto.request.BookmarkCreateDTO;
import me.remontada.readify.dto.response.BookmarkResponseDTO;
import me.remontada.readify.model.User;

import java.util.List;
import java.util.Optional;

public interface BookmarkService {

    /**
     * Save or update a bookmark for a user
     * If bookmark exists for the same book and user, it will be updated with new page number
     */
    BookmarkResponseDTO saveOrUpdateBookmark(BookmarkCreateDTO bookmarkDTO, User user);

    /**
     * Get a user's bookmark for a specific book
     */
    Optional<BookmarkResponseDTO> getUserBookmarkForBook(Long bookId, User user);

    /**
     * Get all bookmarks for a user, ordered by most recent
     */
    List<BookmarkResponseDTO> getUserBookmarks(User user);

    /**
     * Get the most recent bookmark for a user (for "Continue Reading" section)
     */
    Optional<BookmarkResponseDTO> getMostRecentBookmark(User user);

    /**
     * Delete a bookmark
     */
    void deleteBookmark(Long bookmarkId, User user);

    /**
     * Delete bookmark by book ID
     */
    void deleteBookmarkByBookId(Long bookId, User user);
}
