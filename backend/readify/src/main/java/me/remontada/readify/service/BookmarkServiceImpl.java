package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.BookmarkCreateDTO;
import me.remontada.readify.dto.response.BookmarkResponseDTO;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.Bookmark;
import me.remontada.readify.model.User;
import me.remontada.readify.repository.BookRepository;
import me.remontada.readify.repository.BookmarkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BookmarkServiceImpl implements BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final BookRepository bookRepository;

    public BookmarkServiceImpl(BookmarkRepository bookmarkRepository, BookRepository bookRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    @Transactional
    public BookmarkResponseDTO saveOrUpdateBookmark(BookmarkCreateDTO bookmarkDTO, User user) {
        log.info("Saving/updating bookmark for book {} by user {} at page {}",
                bookmarkDTO.getBookId(), user.getEmail(), bookmarkDTO.getPageNumber());

        // Find the book
        Book book = bookRepository.findById(bookmarkDTO.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookmarkDTO.getBookId()));

        // Check if user already has a bookmark for this book
        Optional<Bookmark> existingBookmark = bookmarkRepository.findByUserAndBook(user, book);

        Bookmark bookmark;
        if (existingBookmark.isPresent()) {
            // Update existing bookmark
            bookmark = existingBookmark.get();
            log.info("Updating existing bookmark {} for book {} by user {} from page {} to page {}",
                    bookmark.getId(), bookmarkDTO.getBookId(), user.getEmail(),
                    bookmark.getPageNumber(), bookmarkDTO.getPageNumber());
            bookmark.setPageNumber(bookmarkDTO.getPageNumber());
        } else {
            // Create new bookmark
            log.info("Creating new bookmark for book {} by user {} at page {}",
                    bookmarkDTO.getBookId(), user.getEmail(), bookmarkDTO.getPageNumber());
            bookmark = Bookmark.builder()
                    .user(user)
                    .book(book)
                    .pageNumber(bookmarkDTO.getPageNumber())
                    .build();
        }

        // Save the bookmark
        bookmark = bookmarkRepository.save(bookmark);

        return mapToDTO(bookmark);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BookmarkResponseDTO> getUserBookmarkForBook(Long bookId, User user) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        return bookmarkRepository.findByUserAndBook(user, book)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookmarkResponseDTO> getUserBookmarks(User user) {
        return bookmarkRepository.findByUserOrderByUpdatedAtDesc(user)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BookmarkResponseDTO> getMostRecentBookmark(User user) {
        List<Bookmark> bookmarks = bookmarkRepository.findMostRecentBookmarkByUser(user);

        if (bookmarks.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(mapToDTO(bookmarks.get(0)));
    }

    @Override
    @Transactional
    public void deleteBookmark(Long bookmarkId, User user) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .orElseThrow(() -> new RuntimeException("Bookmark not found with id: " + bookmarkId));

        // Check if the bookmark belongs to the user
        if (!bookmark.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own bookmarks");
        }

        bookmarkRepository.delete(bookmark);
        log.info("Deleted bookmark {} for book {} by user {}",
                bookmarkId, bookmark.getBook().getId(), user.getEmail());
    }

    @Override
    @Transactional
    public void deleteBookmarkByBookId(Long bookId, User user) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));

        Optional<Bookmark> bookmark = bookmarkRepository.findByUserAndBook(user, book);

        if (bookmark.isPresent()) {
            bookmarkRepository.delete(bookmark.get());
            log.info("Deleted bookmark for book {} by user {}", bookId, user.getEmail());
        } else {
            log.info("No bookmark found for book {} by user {}", bookId, user.getEmail());
        }
    }

    /**
     * Map Bookmark entity to BookmarkResponseDTO
     */
    private BookmarkResponseDTO mapToDTO(Bookmark bookmark) {
        return BookmarkResponseDTO.builder()
                .id(bookmark.getId())
                .userId(bookmark.getUser().getId())
                .bookId(bookmark.getBook().getId())
                .bookTitle(bookmark.getBook().getTitle())
                .bookAuthor(bookmark.getBook().getAuthor())
                .bookCoverImageUrl(bookmark.getBook().getCoverImageUrl())
                .pageNumber(bookmark.getPageNumber())
                .createdAt(bookmark.getCreatedAt())
                .updatedAt(bookmark.getUpdatedAt())
                .build();
    }
}
