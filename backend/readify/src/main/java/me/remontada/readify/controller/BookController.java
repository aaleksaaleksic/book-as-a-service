package me.remontada.readify.controller;

import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.BookService;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    public ResponseEntity<List<Book>> getAllBooks(@RequestParam(required = false) String type) {
        try {
            List<Book> books;

            if ("free".equalsIgnoreCase(type)) {
                books = bookService.getFreeBooks();
            } else if ("premium".equalsIgnoreCase(type)) {
                books = bookService.getPremiumBooks();
            } else {
                books = bookService.getAllAvailableBooks();
            }

            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        Optional<Book> book = bookService.findById(id);
        return book.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Book>> searchBooks(@RequestParam String q) {
        try {
            List<Book> books = bookService.searchBooks(q);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        try {
            List<String> categories = bookService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Book>> getBooksByCategory(@PathVariable String category) {
        try {
            List<Book> books = bookService.findByCategory(category);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/author/{author}")
    public ResponseEntity<List<Book>> getBooksByAuthor(@PathVariable String author) {
        try {
            List<Book> books = bookService.findByAuthor(author);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/popular")
    public ResponseEntity<List<Book>> getPopularBooks() {
        try {
            List<Book> books = bookService.getPopularBooks();
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<Book>> getTopRatedBooks() {
        try {
            List<Book> books = bookService.getTopRatedBooks();
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBook(@RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String author = (String) request.get("author");
            String description = (String) request.get("description");
            String isbn = (String) request.get("isbn");
            String category = (String) request.get("category");
            Integer pages = (Integer) request.get("pages");
            String language = (String) request.get("language");
            Integer publicationYear = (Integer) request.get("publicationYear");

            BigDecimal price = BigDecimal.ZERO;
            if (request.get("price") != null) {
                if (request.get("price") instanceof Number) {
                    price = BigDecimal.valueOf(((Number) request.get("price")).doubleValue());
                } else {
                    price = new BigDecimal(request.get("price").toString());
                }
            }

            Boolean isPremium = (Boolean) request.get("isPremium");
            Long addedByUserId = Long.valueOf(request.get("addedByUserId").toString());

            Optional<User> userOpt = userService.findById(addedByUserId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            Book book = bookService.createBook(title, author, description, isbn, category,
                    pages, language, publicationYear, price, isPremium, userOpt.get());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Book created successfully",
                    "bookId", book.getId(),
                    "book", book
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBook(@PathVariable Long id,
                                                          @RequestBody Map<String, Object> request) {
        try {
            Long updatedByUserId = Long.valueOf(request.get("updatedByUserId").toString());

            Optional<User> userOpt = userService.findById(updatedByUserId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            // Create book object with updated data
            Book bookData = new Book();
            if (request.get("title") != null) bookData.setTitle((String) request.get("title"));
            if (request.get("author") != null) bookData.setAuthor((String) request.get("author"));
            if (request.get("description") != null) bookData.setDescription((String) request.get("description"));
            if (request.get("category") != null) bookData.setCategory((String) request.get("category"));
            if (request.get("pages") != null) bookData.setPages((Integer) request.get("pages"));
            if (request.get("language") != null) bookData.setLanguage((String) request.get("language"));
            if (request.get("isPremium") != null) bookData.setIsPremium((Boolean) request.get("isPremium"));
            if (request.get("isAvailable") != null) bookData.setIsAvailable((Boolean) request.get("isAvailable"));

            if (request.get("price") != null) {
                BigDecimal price;
                if (request.get("price") instanceof Number) {
                    price = BigDecimal.valueOf(((Number) request.get("price")).doubleValue());
                } else {
                    price = new BigDecimal(request.get("price").toString());
                }
                bookData.setPrice(price);
            }

            Book updatedBook = bookService.updateBook(id, bookData, userOpt.get());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Book updated successfully",
                    "book", updatedBook
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable Long id) {
        try {
            bookService.deleteBook(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Book deleted successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> getBookContent(@PathVariable Long id,
                                                              @RequestParam Long userId) {
        try {
            Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "User not found"
                ));
            }

            Book book = bookService.getBookContent(id, userOpt.get());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Book content accessed",
                    "book", book,
                    "contentPreview", book.getContentPreview(),
                    "canAccess", book.isAccessibleToUser(userOpt.get())
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new RuntimeException("User not authenticated");
        }
        return (User) authentication.getPrincipal();
    }
}