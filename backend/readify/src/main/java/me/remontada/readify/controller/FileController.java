package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.mapper.BookMapper;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import me.remontada.readify.service.BookService;
import me.remontada.readify.service.FileStorageService;
import me.remontada.readify.service.PdfStreamingService;
import me.remontada.readify.service.StreamingSessionService;
import me.remontada.readify.service.StreamingSessionService.StreamingSession;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
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
    private final PdfStreamingService pdfStreamingService;
    private final StreamingSessionService streamingSessionService;

    @Autowired
    public FileController(FileStorageService fileStorageService,
                          BookService bookService,
                          UserService userService,
                          PdfStreamingService pdfStreamingService,
                          StreamingSessionService streamingSessionService) {
        this.fileStorageService = fileStorageService;
        this.bookService = bookService;
        this.userService = userService;
        this.pdfStreamingService = pdfStreamingService;
        this.streamingSessionService = streamingSessionService;
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
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<?> streamBookContent(@PathVariable Long bookId,
                                               Authentication authentication,
                                               HttpServletRequest request,
                                               @RequestHeader HttpHeaders headers) {
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

            String sessionToken = headers.getFirst("X-Readify-Session");
            if (sessionToken == null || sessionToken.isBlank()) {
                sessionToken = request.getParameter("sessionToken");
            }

            String providedSignature = headers.getFirst("X-Readify-Watermark");
            if (providedSignature == null || providedSignature.isBlank()) {
                providedSignature = request.getParameter("watermark");
            }

            Instant issuedAt = null;
            String issuedAtHeader = headers.getFirst("X-Readify-Issued-At");
            if (issuedAtHeader == null || issuedAtHeader.isBlank()) {
                issuedAtHeader = request.getParameter("issuedAt");
            }

            if (issuedAtHeader != null && !issuedAtHeader.isBlank()) {
                try {
                    issuedAt = Instant.parse(issuedAtHeader);
                } catch (DateTimeParseException e) {
                    log.warn("Failed to parse issuedAt header for book {}: {}", bookId, issuedAtHeader);
                }
            }

            Optional<StreamingSession> sessionOpt = streamingSessionService.validateSession(
                    sessionToken,
                    currentUser.getId(),
                    bookId,
                    providedSignature,
                    issuedAt,
                    currentUser,
                    book
            );

            if (sessionOpt.isEmpty()) {
                log.warn("Rejected streaming request for book {} by user {} due to invalid session", bookId, userEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "success", false,
                        "message", "Invalid or expired streaming session"
                ));
            }

            StreamingSession session = sessionOpt.get();

            // Dohvatanje PDF resursa
            Resource bookResource = fileStorageService.getBookPdf(bookId);
            ResourceRegion region = pdfStreamingService.getResourceRegion(bookResource, headers);

            long contentLength = bookResource.contentLength();
            long rangeStart = region.getPosition();
            long rangeEnd = Math.min(rangeStart + region.getCount() - 1, contentLength - 1);

            String clientIp = request.getRemoteAddr();

            if (streamingSessionService.markReadCountRegistered(session.getToken())) {
                bookService.incrementReadCount(bookId);
            }

            // Logovanje pristupa (za analytics)
            log.info("User {} streaming book: {} ({}) from IP {} range {}-{} ({} bytes)",
                    userEmail, book.getTitle(), bookId, clientIp, rangeStart, rangeEnd, region.getCount());

            HttpStatus status = HttpStatus.PARTIAL_CONTENT;

            return ResponseEntity.status(status)
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(region.getCount())
                    .cacheControl(CacheControl.noStore())
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_RANGE,
                            String.format("bytes %d-%d/%d", rangeStart, rangeEnd, contentLength))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + sanitizeFilename(book.getTitle()) + ".pdf\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("X-Frame-Options", "DENY")
                    .header("Referrer-Policy", "no-referrer")
                    .header("Permissions-Policy", "fullscreen=(), geolocation=()")
                    .header("Pragma", "no-cache")
                    .header("Expires", "0")
                    .header("X-Download-Options", "noopen")
                    .header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'self';")
                    .header("X-Readify-Watermark", session.getWatermarkSignature())
                    .body(region);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid range requested for book {}: {}", bookId, e.getMessage());
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).body(Map.of(
                    "success", false,
                    "message", "Requested range not satisfiable"
            ));
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
            @RequestParam(value = "pdf", required = false) MultipartFile pdfFile,
            @RequestParam(value = "cover", required = false) MultipartFile coverFile,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Provera da knjiga postoji
            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            boolean pdfProvided = pdfFile != null && !pdfFile.isEmpty();
            boolean coverProvided = coverFile != null && !coverFile.isEmpty();

            if (!pdfProvided && !coverProvided) {
                throw new IllegalArgumentException("At least one file (pdf or cover) is required");
            }

            if (pdfProvided) {
                String pdfPath = fileStorageService.saveBookPdf(pdfFile, bookId);
                book.setContentFilePath(pdfPath);
                response.put("pdfPath", pdfPath);
            }

            if (coverProvided) {
                String coverPath = fileStorageService.saveBookCover(coverFile, bookId);
                book.setCoverImageUrl(coverPath);
                response.put("coverPath", coverPath);
            }

            Book updatedBook = bookService.save(book);

            log.info("Uploaded files for book {} by user {}",
                    bookId, authentication.getName());

            response.put("success", true);
            response.put("message", "Files uploaded successfully");
            response.put("book", BookMapper.toResponseDTO(updatedBook));

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
            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            fileStorageService.deleteBookFiles(bookId);

            book.setContentFilePath(null);
            book.setCoverImageUrl(null);
            Book updatedBook = bookService.save(book);

            log.info("Deleted files for book {} by user {}",
                    bookId, authentication.getName());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Files deleted successfully",
                    "book", BookMapper.toResponseDTO(updatedBook)
            ));

        } catch (IOException e) {
            log.error("Failed to delete files for book: {}", bookId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to delete files: " + e.getMessage()
            ));
        } catch (RuntimeException e) {
            log.error("Error deleting files for book: {}", bookId, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
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
        String sanitized = filename.replaceAll("[^a-zA-Z0-9.-]", "_")
                .replaceAll("_{2,}", "_");

        sanitized = sanitized.replaceAll("^_+", "");

        if (sanitized.isBlank()) {
            sanitized = "document";
        }

        return sanitized.substring(0, Math.min(sanitized.length(), 50));
    }
}