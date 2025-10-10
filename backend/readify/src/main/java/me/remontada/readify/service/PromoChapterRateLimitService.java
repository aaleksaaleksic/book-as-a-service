package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Rate limiting service for promo chapter access.
 * Limits anonymous users to 3 promo chapters per day by IP address.
 */
@Slf4j
@Service
public class PromoChapterRateLimitService {

    private static final int MAX_PROMO_CHAPTERS_PER_DAY = 2;
    private static final long CLEANUP_INTERVAL_HOURS = 6;

    private final ConcurrentMap<String, IpAccessTracker> ipTrackers = new ConcurrentHashMap<>();
    private volatile Instant lastCleanup = Instant.now();

    /**
     * Check if an IP address can access a promo chapter.
     *
     * @param ipAddress The IP address making the request
     * @param bookId The book ID being accessed
     * @return PromoAccessResult indicating if access is allowed
     */
    public PromoAccessResult checkPromoAccess(String ipAddress, Long bookId) {
        if (ipAddress == null || ipAddress.isBlank()) {
            log.warn("Attempted promo chapter access with null/blank IP address");
            return PromoAccessResult.denied("Invalid request");
        }

        periodicCleanup();

        IpAccessTracker tracker = ipTrackers.computeIfAbsent(ipAddress, k -> new IpAccessTracker());

        LocalDate today = LocalDate.now();

        // If this book was already accessed today, allow it (for refreshing/re-reading)
        if (tracker.hasAccessedBook(today, bookId)) {
            log.debug("IP {} re-accessing promo chapter for book {} (already counted for today)", ipAddress, bookId);
            return PromoAccessResult.allowed(tracker.getBooksAccessedToday(today));
        }

        // Check if limit is reached
        int currentCount = tracker.getAccessCountForDate(today);
        if (currentCount >= MAX_PROMO_CHAPTERS_PER_DAY) {
            log.info("IP {} exceeded daily promo chapter limit ({}/{})", ipAddress, currentCount, MAX_PROMO_CHAPTERS_PER_DAY);
            return PromoAccessResult.limitReached(currentCount);
        }

        // Record access
        tracker.recordAccess(today, bookId);
        int newCount = currentCount + 1;

        log.info("IP {} accessed promo chapter for book {} ({}/{})", ipAddress, bookId, newCount, MAX_PROMO_CHAPTERS_PER_DAY);

        return PromoAccessResult.allowed(newCount);
    }

    /**
     * Get current promo access status for an IP address
     */
    public PromoAccessStatus getAccessStatus(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return new PromoAccessStatus(0, MAX_PROMO_CHAPTERS_PER_DAY, false);
        }

        IpAccessTracker tracker = ipTrackers.get(ipAddress);
        if (tracker == null) {
            return new PromoAccessStatus(0, MAX_PROMO_CHAPTERS_PER_DAY, false);
        }

        LocalDate today = LocalDate.now();
        int count = tracker.getAccessCountForDate(today);
        boolean limitReached = count >= MAX_PROMO_CHAPTERS_PER_DAY;

        return new PromoAccessStatus(count, MAX_PROMO_CHAPTERS_PER_DAY, limitReached);
    }

    /**
     * Clean up old tracking data
     */
    private void periodicCleanup() {
        Instant now = Instant.now();
        if (ChronoUnit.HOURS.between(lastCleanup, now) >= CLEANUP_INTERVAL_HOURS) {
            lastCleanup = now;

            int removed = cleanupExpiredTrackers();
            log.debug("Promo chapter rate limit cleanup: removed {} expired IP trackers", removed);
        }
    }

    private int cleanupExpiredTrackers() {
        LocalDate cutoffDate = LocalDate.now().minusDays(2); // Keep 2 days of history
        int removedCount = 0;
        var iterator = ipTrackers.entrySet().iterator();

        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (entry.getValue().shouldRemove(cutoffDate)) {
                iterator.remove();
                removedCount++;
            }
        }

        return removedCount;
    }

    /**
     * Tracks promo chapter access per IP address by date
     */
    private static class IpAccessTracker {
        private final ConcurrentMap<LocalDate, Set<Long>> accessesByDate = new ConcurrentHashMap<>();
        private volatile Instant lastAccess = Instant.now();

        public void recordAccess(LocalDate date, Long bookId) {
            lastAccess = Instant.now();
            accessesByDate.computeIfAbsent(date, k -> ConcurrentHashMap.newKeySet()).add(bookId);
        }

        public boolean hasAccessedBook(LocalDate date, Long bookId) {
            Set<Long> books = accessesByDate.get(date);
            return books != null && books.contains(bookId);
        }

        public int getAccessCountForDate(LocalDate date) {
            Set<Long> books = accessesByDate.get(date);
            return books != null ? books.size() : 0;
        }

        public int getBooksAccessedToday(LocalDate today) {
            return getAccessCountForDate(today);
        }

        public boolean shouldRemove(LocalDate cutoffDate) {
            // Remove if all access dates are before cutoff
            return accessesByDate.keySet().stream().allMatch(date -> date.isBefore(cutoffDate));
        }
    }

    public static class PromoAccessResult {
        private final boolean allowed;
        private final String reason;
        private final int currentCount;
        private final int maxCount = MAX_PROMO_CHAPTERS_PER_DAY;

        private PromoAccessResult(boolean allowed, String reason, int currentCount) {
            this.allowed = allowed;
            this.reason = reason;
            this.currentCount = currentCount;
        }

        public static PromoAccessResult allowed(int currentCount) {
            return new PromoAccessResult(true, null, currentCount);
        }

        public static PromoAccessResult limitReached(int currentCount) {
            return new PromoAccessResult(false, "Daily promo chapter limit reached", currentCount);
        }

        public static PromoAccessResult denied(String reason) {
            return new PromoAccessResult(false, reason, MAX_PROMO_CHAPTERS_PER_DAY);
        }

        public boolean isAllowed() { return allowed; }
        public String getReason() { return reason; }
        public int getCurrentCount() { return currentCount; }
        public int getMaxCount() { return maxCount; }
        public int getRemainingCount() { return Math.max(0, maxCount - currentCount); }
    }

    public static class PromoAccessStatus {
        private final int currentCount;
        private final int maxCount;
        private final boolean limitReached;

        public PromoAccessStatus(int currentCount, int maxCount, boolean limitReached) {
            this.currentCount = currentCount;
            this.maxCount = maxCount;
            this.limitReached = limitReached;
        }

        public int getCurrentCount() { return currentCount; }
        public int getMaxCount() { return maxCount; }
        public boolean isLimitReached() { return limitReached; }
        public int getRemainingCount() { return Math.max(0, maxCount - currentCount); }
    }
}
