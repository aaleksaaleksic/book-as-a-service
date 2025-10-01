package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate limiting service using token bucket algorithm to prevent rapid PDF range requests.
 *
 * Implements per-user and per-session rate limiting to detect and prevent automated
 * PDF downloading attempts while allowing normal reading behavior.
 */
@Slf4j
@Service
public class RateLimitingService {

    private final boolean enabled;
    private final int requestsPerMinute;
    private final int burstSize;
    private final int suspiciousThreshold;
    private final long cleanupIntervalMinutes;

    private final ConcurrentMap<String, TokenBucket> userBuckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, TokenBucket> sessionBuckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, SuspiciousActivityTracker> activityTrackers = new ConcurrentHashMap<>();
    private volatile Instant lastCleanup = Instant.now();

    public RateLimitingService(
            @Value("${app.security.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.security.rate-limit.requests-per-minute:10}") int requestsPerMinute,
            @Value("${app.security.rate-limit.burst-size:20}") int burstSize,
            @Value("${app.security.rate-limit.suspicious-threshold:100}") int suspiciousThreshold,
            @Value("${app.security.rate-limit.cleanup-interval-minutes:30}") long cleanupIntervalMinutes) {

        this.enabled = enabled;
        this.requestsPerMinute = Math.max(1, requestsPerMinute);
        this.burstSize = Math.max(1, burstSize);
        this.suspiciousThreshold = Math.max(50, suspiciousThreshold);
        this.cleanupIntervalMinutes = Math.max(10, cleanupIntervalMinutes);

        log.info("Rate limiting initialized: enabled={}, requests/min={}, burst={}, suspicious={}",
                enabled, this.requestsPerMinute, this.burstSize, this.suspiciousThreshold);
    }

    /**
     * Check if a range request should be allowed for the given user and session.
     *
     * @param userId User ID making the request
     * @param sessionToken Session token for the request
     * @param bookId Book being accessed
     * @param rangeStart Start of the requested byte range
     * @param rangeEnd End of the requested byte range
     * @return RateLimitResult indicating if request is allowed and any warnings
     */
    public RateLimitResult checkRateLimit(Long userId, String sessionToken, Long bookId,
                                        long rangeStart, long rangeEnd) {
        if (!enabled) {
            return RateLimitResult.allowed();
        }

        periodicCleanup();

        String userKey = "user:" + userId;
        String sessionKey = "session:" + sessionToken;
        String activityKey = userId + ":" + bookId;

        // Check user-level rate limit
        TokenBucket userBucket = userBuckets.computeIfAbsent(userKey,
            k -> new TokenBucket(requestsPerMinute, burstSize));

        if (!userBucket.tryConsume()) {
            log.warn("User {} exceeded rate limit (user-level)", userId);
            return RateLimitResult.denied("Rate limit exceeded for user");
        }

        // Check session-level rate limit (more permissive)
        TokenBucket sessionBucket = sessionBuckets.computeIfAbsent(sessionKey,
            k -> new TokenBucket(requestsPerMinute * 2, burstSize * 2));

        if (!sessionBucket.tryConsume()) {
            log.warn("Session {} exceeded rate limit (session-level)", sessionToken);
            return RateLimitResult.denied("Rate limit exceeded for session");
        }

        // Track suspicious activity patterns
        SuspiciousActivityTracker tracker = activityTrackers.computeIfAbsent(activityKey,
            k -> new SuspiciousActivityTracker());

        SuspiciousActivityResult suspiciousResult = tracker.recordRequest(rangeStart, rangeEnd);

        if (suspiciousResult.isSuspicious()) {
            log.warn("Suspicious activity detected for user {} on book {}: {}",
                    userId, bookId, suspiciousResult.getReason());

            if (suspiciousResult.shouldBlock()) {
                return RateLimitResult.denied("Suspicious download pattern detected");
            }

            return RateLimitResult.allowedWithWarning(suspiciousResult.getReason());
        }

        return RateLimitResult.allowed();
    }

    /**
     * Get current rate limit status for a user (for debugging/monitoring)
     */
    public RateLimitStatus getRateLimitStatus(Long userId, String sessionToken) {
        if (!enabled) {
            return new RateLimitStatus(true, -1, -1, false);
        }

        String userKey = "user:" + userId;
        String sessionKey = "session:" + sessionToken;

        TokenBucket userBucket = userBuckets.get(userKey);
        TokenBucket sessionBucket = sessionBuckets.get(sessionKey);

        int userTokens = userBucket != null ? userBucket.getAvailableTokens() : burstSize;
        int sessionTokens = sessionBucket != null ? sessionBucket.getAvailableTokens() : burstSize * 2;

        return new RateLimitStatus(true, userTokens, sessionTokens, false);
    }

    /**
     * Clean up expired buckets and trackers
     */
    private void periodicCleanup() {
        Instant now = Instant.now();
        if (ChronoUnit.MINUTES.between(lastCleanup, now) >= cleanupIntervalMinutes) {
            lastCleanup = now;

            int userBucketsRemoved = cleanupExpiredBuckets(userBuckets);
            int sessionBucketsRemoved = cleanupExpiredBuckets(sessionBuckets);
            int trackersRemoved = cleanupExpiredTrackers();

            log.debug("Rate limit cleanup: removed {} user buckets, {} session buckets, {} trackers",
                    userBucketsRemoved, sessionBucketsRemoved, trackersRemoved);
        }
    }

    private int cleanupExpiredBuckets(ConcurrentMap<String, TokenBucket> buckets) {
        Instant cutoff = Instant.now().minus(cleanupIntervalMinutes * 2, ChronoUnit.MINUTES);
        int removedCount = 0;
        var iterator = buckets.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (entry.getValue().getLastRefill().isBefore(cutoff)) {
                iterator.remove();
                removedCount++;
            }
        }
        return removedCount;
    }

    private int cleanupExpiredTrackers() {
        Instant cutoff = Instant.now().minus(cleanupIntervalMinutes * 2, ChronoUnit.MINUTES);
        int removedCount = 0;
        var iterator = activityTrackers.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (entry.getValue().getLastActivity().isBefore(cutoff)) {
                iterator.remove();
                removedCount++;
            }
        }
        return removedCount;
    }

    /**
     * Token bucket implementation for rate limiting
     */
    private static class TokenBucket {
        private final int capacity;
        private final double refillRate; // tokens per second
        private final AtomicLong tokens; // scaled by 1000 for precision
        private volatile Instant lastRefill;

        public TokenBucket(int requestsPerMinute, int capacity) {
            this.capacity = capacity;
            this.refillRate = requestsPerMinute / 60.0; // tokens per second
            this.tokens = new AtomicLong(capacity * 1000L);
            this.lastRefill = Instant.now();
        }

        public boolean tryConsume() {
            refill();
            long currentTokens = tokens.get();
            if (currentTokens >= 1000) { // 1 token = 1000 units
                return tokens.compareAndSet(currentTokens, currentTokens - 1000);
            }
            return false;
        }

        public int getAvailableTokens() {
            refill();
            return (int) (tokens.get() / 1000);
        }

        public Instant getLastRefill() {
            return lastRefill;
        }

        private void refill() {
            Instant now = Instant.now();
            Instant last = lastRefill;

            if (ChronoUnit.MILLIS.between(last, now) > 100) { // refill every 100ms
                double elapsed = ChronoUnit.MILLIS.between(last, now) / 1000.0;
                long tokensToAdd = (long) (elapsed * refillRate * 1000);

                if (tokensToAdd > 0) {
                    long currentTokens = tokens.get();
                    long newTokens = Math.min(capacity * 1000L, currentTokens + tokensToAdd);

                    if (tokens.compareAndSet(currentTokens, newTokens)) {
                        lastRefill = now;
                    }
                }
            }
        }
    }

    /**
     * Tracks suspicious download patterns
     */
    private class SuspiciousActivityTracker {
        private final AtomicLong requestCount = new AtomicLong(0);
        private final AtomicLong totalBytesRequested = new AtomicLong(0);
        private volatile Instant firstRequest = Instant.now();
        private volatile Instant lastActivity = Instant.now();
        private volatile long lastRangeEnd = -1;
        private volatile boolean isSequential = true;

        public SuspiciousActivityResult recordRequest(long rangeStart, long rangeEnd) {
            lastActivity = Instant.now();
            long requests = requestCount.incrementAndGet();
            long bytes = totalBytesRequested.addAndGet(rangeEnd - rangeStart + 1);

            // Check if requests are sequential (normal reading pattern)
            if (lastRangeEnd != -1 && rangeStart != lastRangeEnd + 1) {
                isSequential = false;
            }
            lastRangeEnd = rangeEnd;

            long timeSpanMinutes = ChronoUnit.MINUTES.between(firstRequest, lastActivity);

            // Suspicious patterns
            if (requests > suspiciousThreshold) {
                return new SuspiciousActivityResult(true, true,
                    "Too many requests in session: " + requests);
            }

            if (timeSpanMinutes > 0 && requests / timeSpanMinutes > 50) {
                return new SuspiciousActivityResult(true, true,
                    "High request rate: " + (requests / timeSpanMinutes) + " req/min");
            }

            if (!isSequential && requests > 20) {
                return new SuspiciousActivityResult(true, false,
                    "Non-sequential access pattern detected");
            }

            return new SuspiciousActivityResult(false, false, null);
        }

        public Instant getLastActivity() {
            return lastActivity;
        }
    }

    public static class RateLimitResult {
        private final boolean allowed;
        private final String reason;
        private final boolean warning;

        private RateLimitResult(boolean allowed, String reason, boolean warning) {
            this.allowed = allowed;
            this.reason = reason;
            this.warning = warning;
        }

        public static RateLimitResult allowed() {
            return new RateLimitResult(true, null, false);
        }

        public static RateLimitResult allowedWithWarning(String reason) {
            return new RateLimitResult(true, reason, true);
        }

        public static RateLimitResult denied(String reason) {
            return new RateLimitResult(false, reason, false);
        }

        public boolean isAllowed() { return allowed; }
        public String getReason() { return reason; }
        public boolean hasWarning() { return warning; }
    }

    public static class RateLimitStatus {
        private final boolean enabled;
        private final int userTokensAvailable;
        private final int sessionTokensAvailable;
        private final boolean suspended;

        public RateLimitStatus(boolean enabled, int userTokensAvailable, int sessionTokensAvailable, boolean suspended) {
            this.enabled = enabled;
            this.userTokensAvailable = userTokensAvailable;
            this.sessionTokensAvailable = sessionTokensAvailable;
            this.suspended = suspended;
        }

        public boolean isEnabled() { return enabled; }
        public int getUserTokensAvailable() { return userTokensAvailable; }
        public int getSessionTokensAvailable() { return sessionTokensAvailable; }
        public boolean isSuspended() { return suspended; }
    }

    private static class SuspiciousActivityResult {
        private final boolean suspicious;
        private final boolean shouldBlock;
        private final String reason;

        public SuspiciousActivityResult(boolean suspicious, boolean shouldBlock, String reason) {
            this.suspicious = suspicious;
            this.shouldBlock = shouldBlock;
            this.reason = reason;
        }

        public boolean isSuspicious() { return suspicious; }
        public boolean shouldBlock() { return shouldBlock; }
        public String getReason() { return reason; }
    }
}