package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.BookResponseDTO;
import me.remontada.readify.mapper.BookMapper;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.BookService;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@Slf4j
@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService bookService;
    private final UserService userService;

    @Autowired
    public BookController(BookService bookService, UserService userService) {
        this.bookService = bookService;
        this.userService = userService;
    }


    @GetMapping
    public ResponseEntity<List<BookResponseDTO>> getAllBooks(@RequestParam(required = false) String type) {
        try {
            List<Book> books;

            if ("free".equalsIgnoreCase(type)) {
                books = bookService.getFreeBooks();
            } else if ("premium".equalsIgnoreCase(type)) {
                books = bookService.getPremiumBooks();
            } else {
                books = bookService.getAllAvailableBooks();
            }

            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching books with type: {}", type, e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<BookResponseDTO> getBookById(@PathVariable Long id) {
        try {
            Optional<Book> bookOpt = bookService.findById(id);

            if (bookOpt.isPresent()) {
                BookResponseDTO response = BookMapper.toResponseDTO(bookOpt.get());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Book not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            log.error("Error fetching book with ID: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/search")
    public ResponseEntity<List<BookResponseDTO>> searchBooks(@RequestParam String q) {
        try {
            log.info("Searching books with query: '{}'", q);

            List<Book> books = bookService.searchBooks(q);

            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching books with query: '{}'", q, e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        try {
            List<String> categories = bookService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error fetching categories", e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/category/{category}")
    public ResponseEntity<List<BookResponseDTO>> getBooksByCategory(@PathVariable String category) {
        try {
            List<Book> books = bookService.findByCategory(category);

            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching books by category: {}", category, e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/author/{author}")
    public ResponseEntity<List<BookResponseDTO>> getBooksByAuthor(@PathVariable String author) {
        try {
            List<Book> books = bookService.findByAuthor(author);

            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching books by author: {}", author, e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/popular")
    public ResponseEntity<List<BookResponseDTO>> getPopularBooks() {
        try {
            List<Book> books = bookService.getPopularBooks();

            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching popular books", e);
            return ResponseEntity.status(500).build();
        }
    }


    @GetMapping("/top-rated")
    public ResponseEntity<List<BookResponseDTO>> getTopRatedBooks() {
        try {
            List<Book> books = bookService.getTopRatedBooks();

            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }


    @PostMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> createBook(@RequestBody Map<String, Object> request,
                                                          Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            String title = (String) request.get("title");
            String author = (String) request.get("author");
            String description = (String) request.get("description");
            String isbn = (String) request.get("isbn");
            String category = (String) request.get("category");
            Integer pages = (Integer) request.get("pages");
            String language = (String) request.get("language");
            Integer publicationYear = (Integer) request.get("publicationYear");
            Boolean isPremium = (Boolean) request.get("isPremium");

            BigDecimal price = parsePrice(request.get("price"));

            Book createdBook = bookService.createBook(
                    title, author, description, isbn, category,
                    pages, language, publicationYear, price, isPremium, currentUser
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Book created successfully");
            response.put("bookId", createdBook.getId());

            response.put("book", BookMapper.toResponseDTO(createdBook));


            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error creating book", e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error creating book: " + e.getMessage()
            ));
        }
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_UPDATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> updateBook(@PathVariable Long id,
                                                          @RequestBody Map<String, Object> request,
                                                          Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            // Create update data object
            Book bookData = new Book();
            if (request.get("title") != null) bookData.setTitle((String) request.get("title"));
            if (request.get("author") != null) bookData.setAuthor((String) request.get("author"));
            if (request.get("description") != null) bookData.setDescription((String) request.get("description"));
            if (request.get("category") != null) bookData.setCategory((String) request.get("category"));
            if (request.get("pages") != null) bookData.setPages((Integer) request.get("pages"));
            if (request.get("language") != null) bookData.setLanguage((String) request.get("language"));
            if (request.get("isPremium") != null) bookData.setIsPremium((Boolean) request.get("isPremium"));
            if (request.get("isAvailable") != null) bookData.setIsAvailable((Boolean) request.get("isAvailable"));

            // Handle price update
            if (request.get("price") != null) {
                bookData.setPrice(parsePrice(request.get("price")));
            }

            Book updatedBook = bookService.updateBook(id, bookData, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Book updated successfully");
            response.put("book", BookMapper.toResponseDTO(updatedBook));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error updating book ID: {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error updating book: " + e.getMessage()
            ));
        }
    }

    /**
     * Delete book endpoint
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable Long id,
                                                          Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            bookService.deleteBook(id);

            log.info("Deleted book ID: {} by user: {}", id, currentUser.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Book deleted successfully"
            ));

        } catch (Exception e) {
            log.error("Error deleting book ID: {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error deleting book: " + e.getMessage()
            ));
        }
    }


    @GetMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> getBookContent(@PathVariable Long id,
                                                              Authentication authentication) {
        try {
            User user = getCurrentUser(authentication);
            Book book = bookService.getBookContent(id, user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Book content accessed");

            // CRITICAL FIX: Return DTO instead of entity
            response.put("book", BookMapper.toResponseDTO(book));
            response.put("contentPreview", book.getContentPreview());
            response.put("canAccess", book.isAccessibleToUser(user));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error accessing book content for ID: {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error accessing book: " + e.getMessage()
            ));
        }
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        return userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }


    private BigDecimal parsePrice(Object priceObj) {
        if (priceObj == null) {
            return BigDecimal.ZERO;
        }

        if (priceObj instanceof Number) {
            return BigDecimal.valueOf(((Number) priceObj).doubleValue());
        } else if (priceObj instanceof String) {
            try {
                return new BigDecimal((String) priceObj);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid price format: " + priceObj);
            }
        } else {
            throw new IllegalArgumentException("Price must be a number or string");
        }
    }
}