package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.BookmarkCreateDTO;
import me.remontada.readify.dto.response.BookmarkResponseDTO;
import me.remontada.readify.model.User;
import me.remontada.readify.service.BookmarkService;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;
    private final UserService userService;

    @Autowired
    public BookmarkController(BookmarkService bookmarkService, UserService userService) {
        this.bookmarkService = bookmarkService;
        this.userService = userService;
    }

    /**
     * Save or update a bookmark for the authenticated user
     * POST /api/v1/bookmarks
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookmarkResponseDTO> saveBookmark(
            @Valid @RequestBody BookmarkCreateDTO bookmarkDTO,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            BookmarkResponseDTO savedBookmark = bookmarkService.saveOrUpdateBookmark(bookmarkDTO, user);

            log.info("Bookmark saved for user {} on book {} at page {}",
                    userEmail, bookmarkDTO.getBookId(), bookmarkDTO.getPageNumber());

            return ResponseEntity.status(HttpStatus.CREATED).body(savedBookmark);

        } catch (RuntimeException e) {
            log.error("Error saving bookmark: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Unexpected error saving bookmark", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all bookmarks for the authenticated user
     * GET /api/v1/bookmarks
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookmarkResponseDTO>> getUserBookmarks(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<BookmarkResponseDTO> bookmarks = bookmarkService.getUserBookmarks(user);

            return ResponseEntity.ok(bookmarks);

        } catch (Exception e) {
            log.error("Error fetching bookmarks", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get bookmark for a specific book for the authenticated user
     * GET /api/v1/bookmarks/book/{bookId}
     */
    @GetMapping("/book/{bookId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookmarkResponseDTO> getBookmarkForBook(
            @PathVariable Long bookId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<BookmarkResponseDTO> bookmark = bookmarkService.getUserBookmarkForBook(bookId, user);

            return bookmark.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error fetching bookmark for book {}", bookId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get the most recent bookmark for the authenticated user (for "Continue Reading")
     * GET /api/v1/bookmarks/recent
     */
    @GetMapping("/recent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookmarkResponseDTO> getMostRecentBookmark(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<BookmarkResponseDTO> bookmark = bookmarkService.getMostRecentBookmark(user);

            return bookmark.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error fetching most recent bookmark", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a bookmark by ID
     * DELETE /api/v1/bookmarks/{bookmarkId}
     */
    @DeleteMapping("/{bookmarkId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteBookmark(
            @PathVariable Long bookmarkId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            bookmarkService.deleteBookmark(bookmarkId, user);

            log.info("Bookmark {} deleted by user {}", bookmarkId, userEmail);

            return ResponseEntity.noContent().build();

        } catch (RuntimeException e) {
            log.error("Error deleting bookmark: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Unexpected error deleting bookmark", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete bookmark for a specific book
     * DELETE /api/v1/bookmarks/book/{bookId}
     */
    @DeleteMapping("/book/{bookId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteBookmarkByBookId(
            @PathVariable Long bookId,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            User user = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            bookmarkService.deleteBookmarkByBookId(bookId, user);

            log.info("Bookmark for book {} deleted by user {}", bookId, userEmail);

            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            log.error("Error deleting bookmark for book {}", bookId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
