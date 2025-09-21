package me.remontada.readify.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Book;
import me.remontada.readify.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * In-memory storage for short lived streaming sessions used to authorise PDF range requests.
 *
 * <p>The controller exposes a temporary token to the client which must be presented alongside a
 * watermark signature for every chunk request. This service keeps track of the issued tokens,
 * verifies that they belong to the expected user/book combination and prevents repeated read count
 * increments for the same viewing session.</p>
 */
@Slf4j
@Service
public class StreamingSessionService {

    private static final DateTimeFormatter WATERMARK_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneOffset.UTC);

    private final Duration sessionTtl;
    private final byte[] hmacKey;
    private final ConcurrentMap<String, StreamingSession> sessions = new ConcurrentHashMap<>();

    public StreamingSessionService(
            @Value("${app.streaming.session-ttl-seconds:7200}") long sessionTtlSeconds,
            @Value("${app.streaming.watermark-secret:}") String watermarkSecret,
            @Value("${readify.jwt.secret:readify-default-secret}") String fallbackSecret) {

        if (sessionTtlSeconds <= 0) {
            log.warn("Invalid streaming session TTL supplied ({}). Falling back to 2 hours.", sessionTtlSeconds);
            sessionTtlSeconds = 7200;
        }

        this.sessionTtl = Duration.ofSeconds(sessionTtlSeconds);

        String secretToUse = watermarkSecret != null && !watermarkSecret.isBlank()
                ? watermarkSecret
                : fallbackSecret;

        if (secretToUse == null || secretToUse.isBlank()) {
            throw new IllegalStateException("Watermark secret must not be empty");
        }

        this.hmacKey = secretToUse.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generate a new streaming session for the supplied user and book combination.
     */
    public StreamingSessionDescriptor openSession(User user, Book book) {
        Objects.requireNonNull(user, "User is required to open a streaming session");
        Objects.requireNonNull(book, "Book is required to open a streaming session");

        cleanupExpiredSessions();

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(sessionTtl);
        String token = UUID.randomUUID().toString();

        String watermarkText = buildWatermarkText(user, book, issuedAt);
        String signature = computeSignature(user.getId(), book.getId(), token, issuedAt);

        StreamingSession session = new StreamingSession(
                token,
                user.getId(),
                book.getId(),
                issuedAt,
                expiresAt,
                watermarkText,
                signature
        );

        sessions.put(token, session);

        return new StreamingSessionDescriptor(token, issuedAt, expiresAt, watermarkText, signature);
    }

    /**
     * Validate that the token provided by the client is still active and belongs to the expected
     * user/book pair. The watermark signature must also match to prevent token theft.
     */
    public Optional<StreamingSession> validateSession(String token,
                                                      Long expectedUserId,
                                                      Long expectedBookId,
                                                      String providedSignature) {
        return validateSession(token, expectedUserId, expectedBookId, providedSignature, null, null, null);
    }

    public Optional<StreamingSession> validateSession(String token,
                                                      Long expectedUserId,
                                                      Long expectedBookId,
                                                      String providedSignature,
                                                      Instant issuedAt,
                                                      User user,
                                                      Book book) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        StreamingSession session = sessions.get(token);
        Instant now = Instant.now();

        if (session != null) {
            if (now.isAfter(session.getExpiresAt())) {
                sessions.remove(token);
                return Optional.empty();
            }

            if (!Objects.equals(expectedUserId, session.getUserId())
                    || !Objects.equals(expectedBookId, session.getBookId())) {
                return Optional.empty();
            }

            if (providedSignature == null || providedSignature.isBlank()) {
                return Optional.empty();
            }

            if (!session.getWatermarkSignature().equals(providedSignature)) {
                return Optional.empty();
            }

            return Optional.of(session);
        }

        if (issuedAt == null || providedSignature == null || providedSignature.isBlank()) {
            return Optional.empty();
        }

        if (now.isAfter(issuedAt.plus(sessionTtl))) {
            return Optional.empty();
        }

        String expectedSignature = computeSignature(expectedUserId, expectedBookId, token, issuedAt);
        if (!expectedSignature.equals(providedSignature)) {
            return Optional.empty();
        }

        if (user == null || book == null) {
            return Optional.empty();
        }

        StreamingSession rehydratedSession = new StreamingSession(
                token,
                expectedUserId,
                expectedBookId,
                issuedAt,
                issuedAt.plus(sessionTtl),
                buildWatermarkText(user, book, issuedAt),
                providedSignature
        );

        StreamingSession existing = sessions.putIfAbsent(token, rehydratedSession);
        return Optional.ofNullable(existing != null ? existing : rehydratedSession);
    }

    /**
     * Ensure that read count is incremented only once per streaming session.
     */
    public boolean markReadCountRegistered(String token) {
        if (token == null) {
            return false;
        }

        StreamingSession session = sessions.get(token);
        if (session == null) {
            return false;
        }

        return session.getReadCountRegistered().compareAndSet(false, true);
    }

    private void cleanupExpiredSessions() {
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> now.isAfter(entry.getValue().getExpiresAt()));
    }

    private String computeSignature(Long userId, Long bookId, String token, Instant issuedAt) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacKey, "HmacSHA256"));
            String payload = String.format("uid:%s|book:%s|token:%s|issued:%s",
                    userId,
                    bookId,
                    token,
                    issuedAt.toString());
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute streaming watermark signature", e);
        }
    }

    private String buildWatermarkText(User user, Book book, Instant issuedAt) {
        String userDescriptor = String.format("%s (%s)", user.getFullName(), user.getEmail());
        String timestamp = WATERMARK_TIMESTAMP_FORMAT.format(issuedAt);
        return String.format("%s • %s • %s", userDescriptor, book.getTitle(), timestamp);
    }

    /**
     * Descriptor returned to the client so that controllers can serialise streaming metadata
     * without exposing the internal session state.
     */
    public record StreamingSessionDescriptor(
            String token,
            Instant issuedAt,
            Instant expiresAt,
            String watermarkText,
            String watermarkSignature
    ) {
    }

    /**
     * Internal representation of an issued session token.
     */
    @Getter
    public static final class StreamingSession {
        private final String token;
        private final Long userId;
        private final Long bookId;
        private final Instant issuedAt;
        private final Instant expiresAt;
        private final String watermarkText;
        private final String watermarkSignature;
        private final AtomicBoolean readCountRegistered = new AtomicBoolean(false);

        private StreamingSession(String token,
                                 Long userId,
                                 Long bookId,
                                 Instant issuedAt,
                                 Instant expiresAt,
                                 String watermarkText,
                                 String watermarkSignature) {
            this.token = token;
            this.userId = userId;
            this.bookId = bookId;
            this.issuedAt = issuedAt;
            this.expiresAt = expiresAt;
            this.watermarkText = watermarkText;
            this.watermarkSignature = watermarkSignature;
        }
    }
}
