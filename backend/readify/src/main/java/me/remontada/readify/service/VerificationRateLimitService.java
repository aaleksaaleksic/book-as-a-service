package me.remontada.readify.service;

import me.remontada.readify.model.VerificationAttempt;
import me.remontada.readify.repository.VerificationAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class VerificationRateLimitService {

    private final VerificationAttemptRepository attemptRepository;

    @Value("${app.verification.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.verification.resend-cooldown-minutes:2}")
    private int cooldownMinutes;

    @Autowired
    public VerificationRateLimitService(VerificationAttemptRepository attemptRepository) {
        this.attemptRepository = attemptRepository;
    }

    /**
     * Checks if the user can attempt verification
     * @param email User's email
     * @return true if verification attempt is allowed
     * @throws RuntimeException if rate limit exceeded
     */
    @Transactional
    public void checkVerificationAttempt(String email) {
        Optional<VerificationAttempt> attemptOpt = attemptRepository.findByEmail(email);

        if (attemptOpt.isEmpty()) {
            // First attempt - create new record
            VerificationAttempt newAttempt = new VerificationAttempt();
            newAttempt.setEmail(email);
            newAttempt.setAttemptCount(1);
            newAttempt.setWindowStartAt(LocalDateTime.now());
            newAttempt.setLastAttemptAt(LocalDateTime.now());
            attemptRepository.save(newAttempt);
            return;
        }

        VerificationAttempt attempt = attemptOpt.get();

        // Check if window has expired - if so, reset
        if (attempt.isWindowExpired(60)) { // 60 minute window
            attempt.resetAttempts();
            attemptRepository.save(attempt);
            return;
        }

        // Check if max attempts exceeded
        if (attempt.getAttemptCount() >= maxAttempts) {
            long minutesUntilReset = java.time.Duration.between(
                    LocalDateTime.now(),
                    attempt.getWindowStartAt().plusMinutes(60)
            ).toMinutes();

            throw new RuntimeException(
                    String.format("Too many verification attempts. Please try again in %d minutes.", minutesUntilReset)
            );
        }

        // Increment attempt count
        attempt.incrementAttempts();
        attemptRepository.save(attempt);
    }

    /**
     * Checks if the user can resend verification email
     * @param email User's email
     * @throws RuntimeException if cooldown period hasn't passed
     */
    @Transactional
    public void checkResendCooldown(String email) {
        Optional<VerificationAttempt> attemptOpt = attemptRepository.findByEmail(email);

        if (attemptOpt.isEmpty()) {
            return; // No previous attempts, allow resend
        }

        VerificationAttempt attempt = attemptOpt.get();
        LocalDateTime cooldownEnd = attempt.getLastAttemptAt().plusMinutes(cooldownMinutes);

        if (cooldownEnd.isAfter(LocalDateTime.now())) {
            long secondsRemaining = java.time.Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds();
            throw new RuntimeException(
                    String.format("Please wait %d seconds before requesting a new code.", secondsRemaining)
            );
        }
    }

    /**
     * Resets verification attempts for a user (called after successful verification)
     * @param email User's email
     */
    @Transactional
    public void resetAttempts(String email) {
        attemptRepository.deleteByEmail(email);
    }
}
