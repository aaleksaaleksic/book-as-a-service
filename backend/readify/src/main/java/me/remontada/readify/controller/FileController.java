package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.BookService;
import me.remontada.readify.service.FileStorageService;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * FileController - REST API za upload i streaming knjiga i cover slika
 *
 * Javni endpoint:
 * - GET /api/v1/files/covers/{bookId} - dohvatanje cover slike
 *
 * Zaštićeni endpoint:
 * - GET /api/v1/files/books/{bookId}/content - streaming PDF-a (samo za subscribere)
 *
 * Admin endpoints:
 * - POST /api/v1/files/upload - upload knjige i cover-a
 * - DELETE /api/v1/files/books/{bookId} - brisanje fajlova
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final BookService bookService;
    private final UserService userService;

    @Autowired
    public FileController(FileStorageService fileStorageService,
                          BookService bookService,
                          UserService userService) {
        this.fileStorageService = fileStorageService;
        this.bookService = bookService;
        this.userService = userService;
    }

    /**
     * JAVNI ENDPOINT - Cover slike mogu svi da vide
     * Kešira se 7 dana za bolje performanse
     */
    @GetMapping("/covers/{bookId}")
    public ResponseEntity<Resource> getBookCover(@PathVariable Long bookId) {
        try {
            Resource coverResource = fileStorageService.getBookCover(bookId);

            // Određivanje content type na osnovu ekstenzije
            String contentType = determineContentType(coverResource.getFilename());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"cover-" + bookId + "\"")
                    .body(coverResource);

        } catch (IOException e) {
            log.error("Failed to load cover for book: {}", bookId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * ZAŠTIĆENI ENDPOINT - PDF mogu da čitaju samo subscriberi
     * No-cache za bezbednost, inline display (ne download)
     */
    @GetMapping("/books/{bookId}/content")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> streamBookContent(@PathVariable Long bookId,
                                               Authentication authentication,
                                               HttpServletRequest request) {
        try {
            // Dohvatanje trenutnog korisnika
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Dohvatanje knjige i provera prava pristupa
            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            // Provera da li korisnik ima pristup (free knjiga ili ima subscription)
            if (!book.isAccessibleToUser(currentUser)) {
                log.warn("Access denied for user {} to book {}", userEmail, bookId);
                return ResponseEntity.status(403).body(Map.of(
                        "success", false,
                        "message", "Subscription required to access this book"
                ));
            }

            // Dohvatanje PDF resursa
            Resource bookResource = fileStorageService.getBookPdf(bookId);

            // Logovanje pristupa (za analytics)
            log.info("User {} accessing book: {} ({})",
                    userEmail, book.getTitle(), bookId);

            // HTTP Headers za sigurnost i prikaz
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    // No-cache za bezbednost
                    .cacheControl(CacheControl.noCache().noStore().mustRevalidate())
                    // Inline = prikaži u browseru, ne forsiraj download
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + sanitizeFilename(book.getTitle()) + ".pdf\"")
                    // Security headers protiv XSS
                    .header("X-Content-Type-Options", "nosniff")
                    .header("X-Frame-Options", "DENY")
                    .body(bookResource);

        } catch (Exception e) {
            log.error("Error streaming book content for ID: {}", bookId, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error accessing book: " + e.getMessage()
            ));
        }
    }

    /**
     * ADMIN ENDPOINT - Upload knjige i cover slike
     * Koristi @RequestParam za multipart/form-data
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> uploadBookFiles(
            @RequestParam("bookId") Long bookId,
            @RequestParam("pdf") MultipartFile pdfFile,
            @RequestParam("cover") MultipartFile coverFile,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Provera da knjiga postoji
            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            // Čuvanje fajlova kroz storage service
            String pdfPath = fileStorageService.saveBookPdf(pdfFile, bookId);
            String coverPath = fileStorageService.saveBookCover(coverFile, bookId);

            // Update putanja u bazi podataka
            book.setContentFilePath(pdfPath);
            book.setCoverImageUrl(coverPath);
            bookService.save(book); // Trebalo bi dodati save() metodu u BookService

            log.info("Uploaded files for book {} by user {}",
                    bookId, authentication.getName());

            response.put("success", true);
            response.put("message", "Files uploaded successfully");
            response.put("pdfPath", pdfPath);
            response.put("coverPath", coverPath);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to upload files for book: {}", bookId, e);
            response.put("success", false);
            response.put("message", "Failed to upload files: " + e.getMessage());
            return ResponseEntity.status(500).body(response);

        } catch (Exception e) {
            log.error("Error during file upload for book: {}", bookId, e);
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    /**
     * ADMIN ENDPOINT - Brisanje fajlova knjige
     */
    @DeleteMapping("/books/{bookId}")
    @PreAuthorize("hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> deleteBookFiles(
            @PathVariable Long bookId,
            Authentication authentication) {

        try {
            fileStorageService.deleteBookFiles(bookId);

            log.info("Deleted files for book {} by user {}",
                    bookId, authentication.getName());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Files deleted successfully"
            ));

        } catch (IOException e) {
            log.error("Failed to delete files for book: {}", bookId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to delete files: " + e.getMessage()
            ));
        }
    }

    /**
     * Helper metoda - određivanje MIME type-a
     */
    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";

        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lower.endsWith(".png")) {
            return "image/png";
        } else if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }

        return "application/octet-stream";
    }

    /**
     * Helper metoda - sanitizacija imena fajla
     * Uklanja specijalne karaktere koji mogu praviti probleme
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) return "document";

        // Zameni sve ne-alfanumeričke karaktere sa _
        return filename.replaceAll("[^a-zA-Z0-9.-]", "_")
                .replaceAll("_{2,}", "_") // Multiple _ to single _
                .substring(0, Math.min(filename.length(), 50)); // Max 50 chars
    }
}