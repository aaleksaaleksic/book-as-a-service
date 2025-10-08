package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.RatingCreateDTO;
import me.remontada.readify.dto.response.BookResponseDTO;
import me.remontada.readify.dto.response.RatingResponseDTO;
import me.remontada.readify.mapper.BookMapper;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.Category;
import me.remontada.readify.model.Publisher;
import me.remontada.readify.model.User;
import me.remontada.readify.service.*;
import me.remontada.readify.service.StreamingSessionService.StreamingSessionDescriptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;


@Slf4j
@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService bookService;
    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final PdfStreamingService pdfStreamingService;
    private final StreamingSessionService streamingSessionService;
    private final CategoryService categoryService;
    private final PublisherService publisherService;
    private final RatingService ratingService;
    private final PromoChapterRateLimitService promoRateLimitService;

    @Autowired
    public BookController(BookService bookService,
                          UserService userService,
                          FileStorageService fileStorageService,
                          PdfStreamingService pdfStreamingService,
                          StreamingSessionService streamingSessionService,
                          CategoryService categoryService,
                          PublisherService publisherService,
                          RatingService ratingService,
                          PromoChapterRateLimitService promoRateLimitService) {
        this.bookService = bookService;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
        this.pdfStreamingService = pdfStreamingService;
        this.streamingSessionService = streamingSessionService;
        this.categoryService = categoryService;
        this.publisherService = publisherService;
        this.ratingService = ratingService;
        this.promoRateLimitService = promoRateLimitService;
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
                log.info("Returning book: id={}, title={}, publisher={}", response.getId(), response.getTitle(), response.getPublisher());
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

    @GetMapping("/promo-chapters")
    public ResponseEntity<List<BookResponseDTO>> getBooksWithPromoChapters() {
        try {
            List<Book> books = bookService.getBooksWithPromoChapters();
            List<BookResponseDTO> response = BookMapper.toResponseDTOList(books);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching books with promo chapters", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/promo-chapters/rate-limit-status")
    public ResponseEntity<Map<String, Object>> getPromoRateLimitStatus(
            jakarta.servlet.http.HttpServletRequest request,
            Authentication authentication) {
        try {
            // If user is authenticated, no rate limit
            if (authentication != null && authentication.isAuthenticated()) {
                return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "limitReached", false,
                    "currentCount", 0,
                    "maxCount", 0,
                    "remainingCount", 999
                ));
            }

            // For anonymous users, check IP-based rate limit
            String ipAddress = getClientIpAddress(request);
            PromoChapterRateLimitService.PromoAccessStatus status =
                promoRateLimitService.getAccessStatus(ipAddress);

            return ResponseEntity.ok(Map.of(
                "authenticated", false,
                "limitReached", status.isLimitReached(),
                "currentCount", status.getCurrentCount(),
                "maxCount", status.getMaxCount(),
                "remainingCount", status.getRemainingCount()
            ));
        } catch (Exception e) {
            log.error("Error checking promo rate limit status", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}/promo-chapter")
    public void streamPromoChapter(@PathVariable Long id,
                                   @RequestHeader(value = "Range", required = false) String rangeHeader,
                                   jakarta.servlet.http.HttpServletRequest request,
                                   Authentication authentication,
                                   jakarta.servlet.http.HttpServletResponse response) {
        try {
            Book book = bookService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            if (!book.hasPromoChapter()) {
                response.setStatus(404);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\": false, \"message\": \"Promo chapter not available\"}");
                return;
            }

            // Check rate limit for anonymous users only
            if (authentication == null || !authentication.isAuthenticated()) {
                String ipAddress = getClientIpAddress(request);
                PromoChapterRateLimitService.PromoAccessResult rateLimitResult =
                    promoRateLimitService.checkPromoAccess(ipAddress, id);

                if (!rateLimitResult.isAllowed()) {
                    response.setStatus(429); // Too Many Requests
                    response.setContentType("application/json");
                    response.getWriter().write(String.format(
                        "{\"success\": false, \"message\": \"%s\", \"currentCount\": %d, \"maxCount\": %d}",
                        rateLimitResult.getReason(),
                        rateLimitResult.getCurrentCount(),
                        rateLimitResult.getMaxCount()
                    ));
                    log.info("Promo chapter rate limit exceeded for IP {} on book {}", ipAddress, id);
                    return;
                }
            }

            org.springframework.core.io.Resource promoResource = fileStorageService.getPromoChapter(id);
            long contentLength = promoResource.contentLength();

            long start = 0;
            long end = contentLength - 1;

            // Handle range requests
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                try {
                    String range = rangeHeader.substring(6);
                    String[] ranges = range.split("-");
                    start = Long.parseLong(ranges[0]);
                    if (ranges.length > 1 && !ranges[1].isEmpty()) {
                        end = Long.parseLong(ranges[1]);
                    }

                    if (start >= contentLength || end >= contentLength || start > end) {
                        response.setStatus(416); // Range Not Satisfiable
                        return;
                    }
                } catch (Exception e) {
                    log.warn("Invalid range header: {}", rangeHeader);
                }
            }

            // Set response headers
            response.setStatus(rangeHeader != null ? 206 : 200);
            response.setContentType("application/pdf");
            response.setHeader("Accept-Ranges", "bytes");
            if (rangeHeader != null) {
                response.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + contentLength);
            }
            response.setHeader("Content-Length", String.valueOf(end - start + 1));
            response.setHeader("Content-Disposition", "inline; filename=\"" + sanitizeFilename(book.getTitle()) + "-promo.pdf\"");

            // Cache headers for public content
            response.setHeader("Cache-Control", "public, max-age=3600");

            // Stream the content
            try (java.io.InputStream inputStream = promoResource.getInputStream()) {
                inputStream.skip(start);
                long bytesToCopy = end - start + 1;
                byte[] buffer = new byte[8192];
                long totalCopied = 0;

                while (totalCopied < bytesToCopy) {
                    int bytesToRead = (int) Math.min(buffer.length, bytesToCopy - totalCopied);
                    int bytesRead = inputStream.read(buffer, 0, bytesToRead);
                    if (bytesRead == -1) break;
                    response.getOutputStream().write(buffer, 0, bytesRead);
                    totalCopied += bytesRead;
                }

                response.getOutputStream().flush();
                log.info("Streamed promo chapter for book {} ({} bytes)", id, totalCopied);
            }

        } catch (Exception e) {
            log.error("Error streaming promo chapter for book {}", id, e);
            try {
                response.setStatus(500);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\": false, \"message\": \"Error streaming promo chapter\"}");
            } catch (java.io.IOException ioEx) {
                log.error("Failed to write error response", ioEx);
            }
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "document";
        String sanitized = filename.replaceAll("[^a-zA-Z0-9.-]", "_")
                .replaceAll("_{2,}", "_")
                .replaceAll("^_+", "");
        if (sanitized.isBlank()) sanitized = "document";
        return sanitized.substring(0, Math.min(sanitized.length(), 50));
    }

    private String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        // Check various headers used by proxies and load balancers
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // X-Forwarded-For can contain multiple IPs, get the first one
            return ip.split(",")[0].trim();
        }

        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        ip = request.getHeader("Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        // Fall back to remote address
        return request.getRemoteAddr();
    }


    @PostMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> createBook(@RequestBody Map<String, Object> request,
                                                          Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            String title = extractString(request.get("title"));
            String author = extractString(request.get("author"));
            String description = extractString(request.get("description"));
            String isbn = extractString(request.get("isbn"));
            String category = extractString(request.get("category"));
            String publisher = extractString(request.get("publisher"));
            Integer pages = extractInteger(request.get("pages"));
            String language = extractString(request.get("language"));
            Integer publicationYear = extractInteger(request.get("publicationYear"));
            Boolean isPremium = extractBoolean(request.get("isPremium"));
            Boolean isAvailable = extractBoolean(request.get("isAvailable"));

            BigDecimal price = parsePrice(request.get("price"));

            Book createdBook = bookService.createBook(
                    title, author, description, isbn, category, publisher,
                    pages, language, publicationYear, price, isPremium, isAvailable, currentUser
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
            if (request.containsKey("title")) bookData.setTitle(extractString(request.get("title")));
            if (request.containsKey("author")) bookData.setAuthor(extractString(request.get("author")));
            if (request.containsKey("description")) bookData.setDescription(extractString(request.get("description")));

            // Handle category update via categoryId
            if (request.containsKey("categoryId")) {
                Integer categoryId = extractInteger(request.get("categoryId"));
                if (categoryId != null) {
                    Category category = categoryService.getCategoryById(categoryId.longValue())
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
                    bookData.setCategory(category);
                }
            }

            // Handle publisher update via publisherId
            if (request.containsKey("publisherId")) {
                Integer publisherId = extractInteger(request.get("publisherId"));
                if (publisherId != null) {
                    me.remontada.readify.model.Publisher publisher = publisherService.getPublisherById(publisherId.longValue())
                        .orElseThrow(() -> new RuntimeException("Publisher not found with id: " + publisherId));
                    bookData.setPublisher(publisher);
                }
            }
            if (request.containsKey("pages")) bookData.setPages(extractInteger(request.get("pages")));
            if (request.containsKey("language")) bookData.setLanguage(extractString(request.get("language")));
            if (request.containsKey("isbn")) bookData.setIsbn(extractString(request.get("isbn")));
            if (request.containsKey("publicationYear")) bookData.setPublicationYear(extractInteger(request.get("publicationYear")));
            if (request.containsKey("isPremium")) bookData.setIsPremium(extractBoolean(request.get("isPremium")));
            if (request.containsKey("isAvailable")) bookData.setIsAvailable(extractBoolean(request.get("isAvailable")));

            // Handle price update
            if (request.containsKey("price")) {
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
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
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

            if (book.isAccessibleToUser(user)) {
                enrichWithStreamingMetadata(response, book, user);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error accessing book content for ID: {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error accessing book: " + e.getMessage()
            ));
        }
    }

    private void enrichWithStreamingMetadata(Map<String, Object> response, Book book, User user) {
        try {
            Long bookId = book.getId();
            long contentLength = fileStorageService.getBookPdfSize(bookId);
            StreamingSessionDescriptor session = streamingSessionService.openSession(user, book);
            String secureUrl = fileStorageService.generateSecureBookUrl(bookId, 2);
            String urlWithSession = UriComponentsBuilder.fromUriString(secureUrl)
                    .queryParam("sessionToken", session.token())
                    .queryParam("watermark", session.watermarkSignature())
                    .queryParam("issuedAt", session.issuedAt().toString())
                    .build()
                    .toUriString();

            Map<String, Object> stream = new HashMap<>();
            stream.put("url", urlWithSession);
            stream.put("contentLength", contentLength);
            stream.put("chunkSize", pdfStreamingService.getChunkSize());
            stream.put("expiresAt", session.expiresAt().toString());
            stream.put("headers", Map.of(
                    "X-Readify-Session", session.token(),
                    "X-Readify-Watermark", session.watermarkSignature(),
                    "X-Readify-Issued-At", session.issuedAt().toString()
            ));

            Map<String, Object> watermark = new HashMap<>();
            watermark.put("text", session.watermarkText());
            watermark.put("signature", session.watermarkSignature());
            watermark.put("issuedAt", session.issuedAt().toString());

            response.put("stream", stream);
            response.put("watermark", watermark);
        } catch (IOException e) {
            log.error("Failed to enrich streaming metadata for book {}", book.getId(), e);
            response.put("stream", Map.of("error", "PDF source unavailable"));
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

    private String extractString(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String str) {
            return str.trim();
        }
        return value.toString();
    }

    private Integer extractInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Integer.parseInt(str.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private Boolean extractBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof String str && !str.isBlank()) {
            return Boolean.parseBoolean(str.trim());
        }
        return null;
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

    // ==================== RATING ENDPOINTS ====================

    /**
     * Add or update rating for a book
     * POST /api/v1/books/{id}/rating
     */
    @PostMapping("/{id}/rating")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> addOrUpdateRating(@PathVariable Long id,
                                                                  @Valid @RequestBody RatingCreateDTO ratingDTO,
                                                                  Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            RatingResponseDTO rating = ratingService.addOrUpdateRating(id, ratingDTO, currentUser);

            log.info("User {} rated book {} with {} stars", currentUser.getEmail(), id, ratingDTO.getRating());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Rating submitted successfully",
                    "rating", rating
            ));

        } catch (Exception e) {
            log.error("Error adding rating for book {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error submitting rating: " + e.getMessage()
            ));
        }
    }

    /**
     * Get user's rating for a specific book
     * GET /api/v1/books/{id}/rating/me
     */
    @GetMapping("/{id}/rating/me")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> getUserRating(@PathVariable Long id,
                                                              Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            Optional<RatingResponseDTO> rating = ratingService.getUserRatingForBook(id, currentUser);

            if (rating.isPresent()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "rating", rating.get()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "rating", (Object) null,
                        "message", "No rating found"
                ));
            }

        } catch (Exception e) {
            log.error("Error fetching user rating for book {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error fetching rating: " + e.getMessage()
            ));
        }
    }

    /**
     * Get all ratings for a book
     * GET /api/v1/books/{id}/ratings
     */
    @GetMapping("/{id}/ratings")
    public ResponseEntity<Map<String, Object>> getBookRatings(@PathVariable Long id) {
        try {
            List<RatingResponseDTO> ratings = ratingService.getBookRatings(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "ratings", ratings,
                    "count", ratings.size()
            ));

        } catch (Exception e) {
            log.error("Error fetching ratings for book {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error fetching ratings: " + e.getMessage()
            ));
        }
    }

    /**
     * Get ratings with reviews for a book
     * GET /api/v1/books/{id}/reviews
     */
    @GetMapping("/{id}/reviews")
    public ResponseEntity<Map<String, Object>> getBookReviews(@PathVariable Long id) {
        try {
            List<RatingResponseDTO> reviews = ratingService.getBookRatingsWithReviews(id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "reviews", reviews,
                    "count", reviews.size()
            ));

        } catch (Exception e) {
            log.error("Error fetching reviews for book {}", id, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error fetching reviews: " + e.getMessage()
            ));
        }
    }

    /**
     * Delete user's rating for a book
     * DELETE /api/v1/books/ratings/{ratingId}
     */
    @DeleteMapping("/ratings/{ratingId}")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> deleteRating(@PathVariable Long ratingId,
                                                             Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            ratingService.deleteRating(ratingId, currentUser);

            log.info("User {} deleted rating {}", currentUser.getEmail(), ratingId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Rating deleted successfully"
            ));

        } catch (Exception e) {
            log.error("Error deleting rating {}", ratingId, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error deleting rating: " + e.getMessage()
            ));
        }
    }
}