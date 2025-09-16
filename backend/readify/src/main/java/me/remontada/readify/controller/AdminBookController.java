package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.BookCreateDTO;
import me.remontada.readify.dto.request.BookUpdateDTO;
import me.remontada.readify.dto.response.BookResponseDTO;
import me.remontada.readify.mapper.BookMapper;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.BookService;
import me.remontada.readify.service.FileStorageService;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/v1/admin/books")
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public class AdminBookController {

    private final BookService bookService;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    @Autowired
    public AdminBookController(BookService bookService,
                               UserService userService,
                               FileStorageService fileStorageService) {
        this.bookService = bookService;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
    }


    @PostMapping
    @PreAuthorize("hasAuthority('CAN_ADD_BOOKS')")
    public ResponseEntity<Map<String, Object>> createBookWithFiles(
            @RequestPart("book") @Valid BookCreateDTO bookDTO,
            @RequestPart("pdf") MultipartFile pdfFile,
            @RequestPart("cover") MultipartFile coverFile,
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

            User currentUser = userService.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            bookDTO.trimStrings();

            Book savedBook = bookService.createBook(
                    bookDTO.getTitle(),
                    bookDTO.getAuthor(),
                    bookDTO.getDescription(),
                    bookDTO.getIsbn(),
                    bookDTO.getCategory(),
                    bookDTO.getPages(),
                    bookDTO.getLanguage(),
                    bookDTO.getPublicationYear(),
                    bookDTO.getPrice(),
                    bookDTO.getIsPremium(),
                    currentUser
            );

            String pdfPath = fileStorageService.saveBookPdf(pdfFile, savedBook.getId());
            String coverPath = fileStorageService.saveBookCover(coverFile, savedBook.getId());

            savedBook.setContentFilePath(pdfPath);
            savedBook.setCoverImageUrl("/api/v1/files/covers/" + savedBook.getId());
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
    @PreAuthorize("hasAuthority('CAN_EDIT_BOOKS')")
    public ResponseEntity<Map<String, Object>> updateBook(
            @PathVariable Long id,
            @Valid @RequestBody BookUpdateDTO updateDTO,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            Book book = bookService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            updateDTO.applyToBook(book);

            Book updatedBook = bookService.save(book);

            log.info("Admin {} updated book ID: {}", authentication.getName(), id);

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
    public ResponseEntity<List<BookResponseDTO>> getAllBooksForAdmin() {
        try {
            List<Book> books = bookService.getAllAvailableBooks(); // Koristi postojeći
            return ResponseEntity.ok(BookMapper.toResponseDTOList(books));
        } catch (Exception e) {
            log.error("Error fetching books for admin", e);
            return ResponseEntity.status(500).build();
        }
    }
}