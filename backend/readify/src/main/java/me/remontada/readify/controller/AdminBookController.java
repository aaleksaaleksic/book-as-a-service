package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.BookCreateDTO;
import me.remontada.readify.dto.request.BookUpdateDTO;
import me.remontada.readify.dto.response.BookResponseDTO;
import me.remontada.readify.mapper.BookMapper;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/v1/admin/books")
public class AdminBookController {

    private final BookService bookService;
    private final UserService userService;
    private final FileStorageService fileStorageService;
    private final CategoryService categoryService;
    private final PublisherService publisherService;

    @Autowired
    public AdminBookController(BookService bookService,
                               UserService userService,
                               FileStorageService fileStorageService,
                               CategoryService categoryService,
                               PublisherService publisherService) {
        this.bookService = bookService;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
        this.categoryService = categoryService;
        this.publisherService = publisherService;
    }


    @PostMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> createBookWithFiles(
            @RequestPart("book") @Valid BookCreateDTO bookDTO,
            @RequestPart("pdf") MultipartFile pdfFile,
            @RequestPart("cover") MultipartFile coverFile,
            @RequestPart(value = "promoChapter", required = false) MultipartFile promoChapterFile,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (pdfFile.isEmpty() || coverFile.isEmpty()) {
                throw new IllegalArgumentException("Both PDF and cover image are required");
            }

            if (!pdfFile.getContentType().equals("application/pdf")) {
                throw new IllegalArgumentException("Invalid PDF file type");
            }

            if (!coverFile.getContentType().startsWith("image/")) {
                throw new IllegalArgumentException("Cover must be an image");
            }

            if (promoChapterFile != null && !promoChapterFile.isEmpty()) {
                if (!promoChapterFile.getContentType().equals("application/pdf")) {
                    throw new IllegalArgumentException("Promo chapter must be a PDF file");
                }
            }

            User currentUser = userService.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            bookDTO.trimStrings();

            log.info("Creating book with categoryId: {}, publisherId: {}", bookDTO.getCategoryId(), bookDTO.getPublisherId());

            Book savedBook = ((me.remontada.readify.service.BookServiceImpl) bookService).createBookWithCategoryId(
                    bookDTO.getTitle(),
                    bookDTO.getAuthor(),
                    bookDTO.getDescription(),
                    bookDTO.getIsbn(),
                    bookDTO.getCategoryId(),
                    bookDTO.getPublisherId(),
                    bookDTO.getPages(),
                    bookDTO.getLanguage(),
                    bookDTO.getPublicationYear(),
                    bookDTO.getPrice(),
                    bookDTO.getIsPremium(),
                    bookDTO.getIsAvailable(),
                    currentUser
            );

            String pdfPath = fileStorageService.saveBookPdf(pdfFile, savedBook.getId());
            String coverPath = fileStorageService.saveBookCover(coverFile, savedBook.getId());

            savedBook.setContentFilePath(pdfPath);
            savedBook.setCoverImageUrl(coverPath);

            // Save promo chapter if provided
            if (promoChapterFile != null && !promoChapterFile.isEmpty()) {
                String promoPath = fileStorageService.savePromoChapter(promoChapterFile, savedBook.getId());
                savedBook.setPromoChapterPath(promoPath);
                log.info("Promo chapter saved for book ID: {}", savedBook.getId());
            }

            Book finalBook = bookService.save(savedBook);

            log.info("Admin {} created book with files: {} (ID: {})",
                    authentication.getName(), finalBook.getTitle(), finalBook.getId());

            response.put("success", true);
            response.put("message", "Book created successfully with files");
            response.put("book", BookMapper.toResponseDTO(finalBook));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            log.error("Error uploading files", e);
            response.put("success", false);
            response.put("message", "File upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        } catch (Exception e) {
            log.error("Error creating book", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_UPDATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody BookUpdateDTO updateDTO,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            log.info("Received update request for book {}: categoryId={}, publisherId={}", id, updateDTO.getCategoryId(), updateDTO.getPublisherId());

            Book book = bookService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            log.info("Book before update: category={}, publisher={}", book.getCategory().getName(), book.getPublisher().getName());

            // Update category if provided
            if (updateDTO.getCategoryId() != null) {
                me.remontada.readify.model.Category category = categoryService.getCategoryById(updateDTO.getCategoryId())
                        .orElseThrow(() -> new RuntimeException("Category not found"));
                book.setCategory(category);
            }

            // Update publisher if provided
            if (updateDTO.getPublisherId() != null) {
                me.remontada.readify.model.Publisher publisher = publisherService.getPublisherById(updateDTO.getPublisherId())
                        .orElseThrow(() -> new RuntimeException("Publisher not found"));
                book.setPublisher(publisher);
            }

            updateDTO.applyToBook(book);
            log.info("Book after applyToBook: category={}, publisher={}", book.getCategory().getName(), book.getPublisher().getName());

            Book updatedBook = bookService.save(book);

            log.info("Admin {} updated book ID: {} - publisher after save: {}", authentication.getName(), id, updatedBook.getPublisher().getName());

            response.put("success", true);
            response.put("message", "Book updated successfully");
            response.put("book", BookMapper.toResponseDTO(updatedBook));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error updating book: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> deleteBook(
            @PathVariable Long id,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            Book book = bookService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            // Soft delete
            book.setIsAvailable(false);
            bookService.save(book);

            log.info("Admin {} soft deleted book ID: {}", authentication.getName(), id);

            response.put("success", true);
            response.put("message", "Book marked as unavailable");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error deleting book: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }


    @GetMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS') or hasAuthority('CAN_UPDATE_BOOKS') or hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<List<BookResponseDTO>> getAllBooksForAdmin() {
        try {
            List<Book> books = bookService.getAllBooks();
            return ResponseEntity.ok(BookMapper.toResponseDTOList(books));
        } catch (Exception e) {
            log.error("Error fetching books for admin", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{id}/promo-chapter")
    @PreAuthorize("hasAuthority('CAN_UPDATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> uploadPromoChapter(
            @PathVariable Long id,
            @RequestPart("promoChapter") MultipartFile promoChapterFile,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (promoChapterFile.isEmpty()) {
                throw new IllegalArgumentException("Promo chapter file is required");
            }

            if (!promoChapterFile.getContentType().equals("application/pdf")) {
                throw new IllegalArgumentException("Promo chapter must be a PDF file");
            }

            Book book = bookService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            String promoPath = fileStorageService.savePromoChapter(promoChapterFile, book.getId());
            book.setPromoChapterPath(promoPath);
            Book updatedBook = bookService.save(book);

            log.info("Admin {} uploaded promo chapter for book ID: {}",
                    authentication.getName(), id);

            response.put("success", true);
            response.put("message", "Promo chapter uploaded successfully");
            response.put("book", BookMapper.toResponseDTO(updatedBook));

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading promo chapter", e);
            response.put("success", false);
            response.put("message", "Promo chapter upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        } catch (Exception e) {
            log.error("Error uploading promo chapter for book: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }
}