package me.remontada.readify.controller;

import me.remontada.readify.dto.response.ReadingSessionResponseDTO;
import me.remontada.readify.mapper.ReadingSessionMapper;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.ReadingSession;
import me.remontada.readify.model.User;
import me.remontada.readify.security.MyUserDetails;
import me.remontada.readify.service.AnalyticsService;
import me.remontada.readify.service.BookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AnalyticsController - REST API for reading analytics and statistics
 *
 * User endpoints:
 * - POST /api/v1/analytics/reading/start - Start reading session
 * - PUT /api/v1/analytics/reading/{sessionId}/end - End reading session
 * - PUT /api/v1/analytics/reading/{sessionId}/progress - Update reading progress
 * - POST /api/v1/analytics/books/{bookId}/click - Track book click
 * - GET /api/v1/analytics/my/reading-history - Get user's reading history
 * - GET /api/v1/analytics/my/stats - Get user's reading statistics
 *
 * Admin endpoints:
 * - GET /api/v1/admin/analytics/dashboard - Admin dashboard statistics
 * - GET /api/v1/admin/analytics/books/popular - Most popular books
 * - GET /api/v1/admin/analytics/books/most-read - Most read books
 * - GET /api/v1/admin/analytics/books/{bookId} - Specific book analytics
 * - GET /api/v1/admin/analytics/readers/top - Top readers
 */
@RestController
@RequestMapping("/api/v1")
public class AnalyticsController {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsController.class);

    private final AnalyticsService analyticsService;
    private final BookService bookService;

    @Autowired
    public AnalyticsController(AnalyticsService analyticsService, BookService bookService) {
        this.analyticsService = analyticsService;
        this.bookService = bookService;
    }



    @PostMapping("/analytics/reading/start")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> startReadingSession(
            @RequestBody Map<String, Object> request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = getCurrentUser(authentication);
            Long bookId = Long.valueOf(request.get("bookId").toString());
            String deviceType = (String) request.getOrDefault("deviceType", "UNKNOWN");

            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            String ipAddress = getClientIpAddress(httpRequest);

            ReadingSession session = analyticsService.startReadingSession(
                    currentUser, book, deviceType, ipAddress);

            logger.info("Reading session started: {} for user: {} book: {}",
                    session.getId(), currentUser.getEmail(), book.getTitle());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reading session started",
                    "session", ReadingSessionMapper.toResponseDTO(session)
            ));

        } catch (Exception e) {
            logger.error("Failed to start reading session", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @PutMapping("/analytics/reading/{sessionId}/end")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> endReadingSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            Integer pagesRead = request.get("pagesRead") != null ?
                    Integer.valueOf(request.get("pagesRead").toString()) : null;

            ReadingSession session = analyticsService.endReadingSession(sessionId, pagesRead);

            logger.info("Reading session ended: {} for user: {}, pages read: {}",
                    sessionId, currentUser.getEmail(), pagesRead);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reading session ended",
                    "session", ReadingSessionMapper.toResponseDTO(session)
            ));

        } catch (Exception e) {
            logger.error("Failed to end reading session", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @PutMapping("/analytics/reading/{sessionId}/progress")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> updateReadingProgress(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            Integer currentPage = Integer.valueOf(request.get("currentPage").toString());

            ReadingSession session = analyticsService.updateReadingProgress(sessionId, currentPage);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Reading progress updated",
                    "session", ReadingSessionMapper.toResponseDTO(session)
            ));

        } catch (Exception e) {
            logger.error("Failed to update reading progress", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }



    @PostMapping("/analytics/books/{bookId}/click")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> trackBookClick(
            @PathVariable Long bookId,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            Book book = bookService.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));

            analyticsService.trackBookClick(book);

            logger.debug("Book click tracked: {} by user: {}", book.getTitle(), currentUser.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Click tracked successfully"
            ));

        } catch (Exception e) {
            logger.error("Failed to track book click", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/analytics/reading/history")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> getReadingHistory(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            List<ReadingSession> sessions = analyticsService.getUserReadingHistory(currentUser);

            List<ReadingSessionResponseDTO> sessionDTOs = ReadingSessionMapper.toResponseDTOList(sessions);

            Long totalReadingTime = analyticsService.getTotalReadingTimeByUser(currentUser);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "sessions", sessionDTOs,
                    "totalReadingTimeMinutes", totalReadingTime,
                    "totalSessions", sessions.size()
            ));

        } catch (Exception e) {
            logger.error("Failed to get reading history", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/analytics/my/stats")
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> getMyReadingStats(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            Long totalReadingTime = analyticsService.getTotalReadingTimeByUser(currentUser);
            List<ReadingSession> recentSessions = analyticsService.getUserReadingHistory(currentUser)
                    .stream().limit(10).toList();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalReadingMinutes", totalReadingTime);
            stats.put("totalReadingHours", totalReadingTime / 60.0);
            stats.put("totalSessions", recentSessions.size());
            stats.put("averageSessionMinutes", recentSessions.isEmpty() ? 0 :
                    totalReadingTime / recentSessions.size());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "stats", stats,
                    "recentSessions", recentSessions.stream()
                            .map(this::mapReadingSessionToResponse)
                            .limit(5)
                            .toList()
            ));

        } catch (Exception e) {
            logger.error("Failed to get user reading stats", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }



    @GetMapping("/admin/analytics/dashboard")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            Map<String, Object> analytics = analyticsService.getDashboardAnalytics();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "analytics", analytics
            ));

        } catch (Exception e) {
            logger.error("Failed to get dashboard analytics", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/admin/analytics/books/popular")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getMostPopularBooks(
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days);

            List<Map<String, Object>> popularBooks = analyticsService.getMostPopularBooks(startDate, endDate);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "books", popularBooks,
                    "period", Map.of(
                            "startDate", startDate,
                            "endDate", endDate,
                            "days", days
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get popular books", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/admin/analytics/books/most-read")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getMostReadBooks(
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days);

            List<Map<String, Object>> mostReadBooks = analyticsService.getMostReadBooks(startDate, endDate);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "books", mostReadBooks,
                    "period", Map.of(
                            "startDate", startDate,
                            "endDate", endDate,
                            "days", days
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get most read books", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/admin/analytics/books/{bookId}")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getBookAnalytics(
            @PathVariable Long bookId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            if (startDate == null) startDate = LocalDate.now().minusDays(30);
            if (endDate == null) endDate = LocalDate.now();

            Map<String, Object> bookAnalytics = analyticsService.getBookAnalytics(bookId, startDate, endDate);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "analytics", bookAnalytics,
                    "period", Map.of(
                            "startDate", startDate,
                            "endDate", endDate
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get book analytics", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/admin/analytics/readers/top")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getTopReaders(
            @RequestParam(defaultValue = "30") int days,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(days);

            List<Map<String, Object>> topReaders = analyticsService.getTopReaders(startDate, endDate);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "readers", topReaders,
                    "period", Map.of(
                            "startDate", startDate,
                            "endDate", endDate,
                            "days", days
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get top readers", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    private User getCurrentUser(Authentication authentication) {
        MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
        return userDetails.getUser();
    }


    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }


    private Map<String, Object> mapReadingSessionToResponse(ReadingSession session) {
        Map<String, Object> response = new HashMap<>();

        response.put("id", session.getId());
        response.put("bookId", session.getBook().getId());
        response.put("bookTitle", session.getBook().getTitle());
        response.put("bookAuthor", session.getBook().getAuthor());
        response.put("sessionStart", session.getSessionStart());
        response.put("sessionEnd", session.getSessionEnd());
        response.put("durationMinutes", session.getDurationMinutes());
        response.put("pagesRead", session.getPagesRead());
        response.put("lastPagePosition", session.getLastPagePosition());
        response.put("deviceType", session.getDeviceType());
        response.put("sessionActive", session.getSessionActive());
        response.put("createdAt", session.getCreatedAt());

        return response;
    }
}