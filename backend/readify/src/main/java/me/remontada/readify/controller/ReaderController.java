package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
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

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;

/**
 * ReaderController - Legacy compatibility endpoint for /api/reader routes
 *
 * This controller provides backward compatibility for frontend applications
 * that still use the /api/reader/{id}/content endpoint by handling JWT token
 * authentication and creating streaming sessions internally.
 */
@Slf4j
@RestController
@RequestMapping("/api/reader")
public class ReaderController {

    private final FileStorageService fileStorageService;
    private final BookService bookService;
    private final UserService userService;
    private final PdfStreamingService pdfStreamingService;
    private final StreamingSessionService streamingSessionService;

    @Autowired
    public ReaderController(FileStorageService fileStorageService,
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
     * Legacy endpoint for streaming book content
     * Accepts JWT token via authToken query parameter and creates streaming session internally
     */
    @GetMapping("/{bookId}/content")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<?> streamBookContent(@PathVariable Long bookId,
                                               Authentication authentication,
                                               HttpServletRequest request,
                                               @RequestHeader HttpHeaders headers,
                                               @RequestParam(value = "authToken", required = false) String authToken) {
        try {
            // Get current user from authentication
            String userEmail = authentication.getName();
            User currentUser = userService.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get book and check access
            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            // Check if user has access to the book
            if (!book.isAccessibleToUser(currentUser)) {
                log.warn("Access denied for user {} to book {}", userEmail, bookId);
                return ResponseEntity.status(403).body(Map.of(
                        "success", false,
                        "message", "Subscription required to access this book"
                ));
            }

            // Check for existing streaming session tokens in headers/params
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
                    log.debug("Failed to parse issuedAt header for book {}: {}", bookId, issuedAtHeader);
                }
            }

            Optional<StreamingSession> sessionOpt = Optional.empty();

            // Try to validate existing session if session token is provided
            if (sessionToken != null && !sessionToken.isBlank()) {
                sessionOpt = streamingSessionService.validateSession(
                        sessionToken,
                        currentUser.getId(),
                        bookId,
                        providedSignature,
                        issuedAt,
                        currentUser,
                        book
                );
            }

            // If no valid session exists, create a new one
            if (sessionOpt.isEmpty()) {
                log.info("Creating new streaming session for user {} and book {}", userEmail, bookId);
                var sessionDescriptor = streamingSessionService.openSession(currentUser, book);

                // Create a new session object from the descriptor
                sessionOpt = streamingSessionService.validateSession(
                        sessionDescriptor.token(),
                        currentUser.getId(),
                        bookId,
                        sessionDescriptor.watermarkSignature(),
                        sessionDescriptor.issuedAt(),
                        currentUser,
                        book
                );
            }

            if (sessionOpt.isEmpty()) {
                log.warn("Failed to create or validate streaming session for book {} by user {}", bookId, userEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "success", false,
                        "message", "Unable to create streaming session"
                ));
            }

            StreamingSession session = sessionOpt.get();

            // Get PDF resource and handle streaming
            Resource bookResource = fileStorageService.getBookPdf(bookId);
            ResourceRegion region = pdfStreamingService.getResourceRegion(bookResource, headers);

            long contentLength = bookResource.contentLength();
            long rangeStart = region.getPosition();
            long rangeEnd = Math.min(rangeStart + region.getCount() - 1, contentLength - 1);

            String clientIp = request.getRemoteAddr();

            // Mark read count if this is the first access in this session
            if (streamingSessionService.markReadCountRegistered(session.getToken())) {
                bookService.incrementReadCount(bookId);
            }

            // Log access
            log.info("User {} streaming book: {} ({}) from IP {} range {}-{} ({} bytes) via legacy /api/reader endpoint",
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
                    .header("X-Readify-Session", session.getToken())
                    .header("X-Readify-Issued-At", session.getIssuedAt().toString())
                    .body(region);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid range requested for book {}: {}", bookId, e.getMessage());
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).body(Map.of(
                    "success", false,
                    "message", "Requested range not satisfiable"
            ));
        } catch (Exception e) {
            log.error("Error streaming book content for ID: {} via legacy endpoint", bookId, e);
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Error accessing book: " + e.getMessage()
            ));
        }
    }

    /**
     * Helper method to sanitize filename for safe download
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) return "document";

        String sanitized = filename.replaceAll("[^a-zA-Z0-9.-]", "_")
                .replaceAll("_{2,}", "_");

        sanitized = sanitized.replaceAll("^_+", "");

        if (sanitized.isBlank()) {
            sanitized = "document";
        }

        return sanitized.substring(0, Math.min(sanitized.length(), 50));
    }
}