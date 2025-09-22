package me.remontada.readify.service;

import me.remontada.readify.model.*;
import me.remontada.readify.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * SubscriptionServiceImpl - Complete subscription management for Readify platform
 *
 * Features:
 * - Monthly/Yearly subscription management
 * - Trial period support (7 days free)
 * - Payment integration with PaymentService
 * - Automatic subscription expiration handling
 * - Admin subscription management
 * - Subscription renewal with payment processing
 */
@Service
@Transactional
public class SubscriptionServiceImpl implements SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionServiceImpl.class);

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentService paymentService;

    // Pricing configuration from application.properties (in RSD)
    @Value("${readify.subscription.monthly-price:999}")
    private BigDecimal monthlyPriceRsd;

    @Value("${readify.subscription.yearly-price:9999}")
    private BigDecimal yearlyPriceRsd;

    @Value("${readify.subscription.trial-duration-days:7}")
    private int trialDurationDays;

    @Autowired
    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   PaymentService paymentService) {
        this.subscriptionRepository = subscriptionRepository;
        this.paymentService = paymentService;
    }

    /**
     * Create new subscription with payment processing
     * Automatically processes payment and activates subscription if successful
     */
    @Override
    public Subscription createSubscription(User user, SubscriptionType type) {
        logger.info("Creating subscription for user: {} type: {}", user.getEmail(), type);

        // Check if user already has active subscription
        Optional<Subscription> existingActive = getUserActiveSubscription(user);
        if (existingActive.isPresent()) {
            throw new RuntimeException("User already has active subscription");
        }

        // Calculate price and duration based on subscription type
        BigDecimal price = getSubscriptionPrice(type);
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = calculateEndDate(startDate, type);

        // Create subscription
        Subscription subscription = new Subscription();
        subscription.setUser(user);
        subscription.setType(type);
        subscription.setStatus(SubscriptionStatus.PENDING); // Will be activated after payment
        subscription.setPriceInRsd(price);
        subscription.setStartDate(startDate);
        subscription.setEndDate(endDate);
        subscription.setAutoRenew(true);
        subscription.setCreatedAt(LocalDateTime.now());

        // Save subscription first to get ID for payment
        subscription = subscriptionRepository.save(subscription);

        // Process payment
        Payment payment = paymentService.processMockPayment(user, subscription, price);

        if (payment.isSuccessful()) {
            // Activate subscription if payment successful
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setActivatedAt(LocalDateTime.now());
            subscription = subscriptionRepository.save(subscription);

            logger.info("Subscription activated for user: {} subscription_id: {}",
                    user.getEmail(), subscription.getId());
        } else {
            // Mark subscription as failed if payment failed
            subscription.setStatus(SubscriptionStatus.PAYMENT_FAILED);
            subscription = subscriptionRepository.save(subscription);

            logger.warn("Subscription payment failed for user: {} subscription_id: {}",
                    user.getEmail(), subscription.getId());

            throw new RuntimeException("Payment failed: " + payment.getBankResponseMessage());
        }

        return subscription;
    }

    /**
     * Get user's currently active subscription
     */
    @Override
    public Optional<Subscription> getUserActiveSubscription(User user) {
        logger.debug("Finding active subscription for user: {}", user.getEmail());
        return subscriptionRepository.findByUserAndStatus(user, SubscriptionStatus.ACTIVE);
    }

    /**
     * Get complete subscription history for user
     */
    @Override
    public List<Subscription> getUserSubscriptionHistory(User user) {
        logger.debug("Fetching subscription history for user: {}", user.getEmail());
        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Cancel user's active subscription
     * Only user or admin can cancel subscription
     */
    @Override
    public Subscription cancelSubscription(Long subscriptionId, User user) {
        logger.info("Canceling subscription: {} for user: {}", subscriptionId, user.getEmail());

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        // Verify user owns this subscription (or is admin)
        if (!subscription.getUser().getId().equals(user.getId()) &&
                !user.getPermissions().contains(Permission.CAN_UPDATE_USERS)) {
            throw new RuntimeException("Not authorized to cancel this subscription");
        }

        // Check if subscription can be cancelled
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("Cannot cancel non-active subscription");
        }

        // Cancel subscription but keep access until end date
        subscription.setStatus(SubscriptionStatus.CANCELED);
        subscription.setCanceledAt(LocalDateTime.now());
        subscription.setAutoRenew(false);

        subscription = subscriptionRepository.save(subscription);
        logger.info("Subscription canceled: {} user retains access until: {}",
                subscriptionId, subscription.getEndDate());

        return subscription;
    }

    /**
     * Check if user has active subscription with access
     */
    @Override
    public boolean hasActiveSubscription(User user) {
        Optional<Subscription> subscription = getUserActiveSubscription(user);
        if (subscription.isEmpty()) {
            return false;
        }

        // Check if subscription is not expired
        Subscription sub = subscription.get();
        boolean hasAccess = sub.getEndDate().isAfter(LocalDateTime.now()) &&
                (sub.getStatus() == SubscriptionStatus.ACTIVE ||
                        sub.getStatus() == SubscriptionStatus.CANCELED);

        logger.debug("User: {} has active subscription: {} access until: {}",
                user.getEmail(), hasAccess, sub.getEndDate());

        return hasAccess;
    }

    /**
     * Create 7-day free trial subscription
     */
    @Override
    public Subscription createTrialSubscription(User user) {
        logger.info("Creating trial subscription for user: {}", user.getEmail());

        // Check if user already had trial
        List<Subscription> history = getUserSubscriptionHistory(user);
        boolean hadTrial = history.stream()
                .anyMatch(s -> s.getType() == SubscriptionType.TRIAL);

        if (hadTrial) {
            throw new RuntimeException("User already used trial subscription");
        }

        // Check for existing active subscription
        Optional<Subscription> existingActive = getUserActiveSubscription(user);
        if (existingActive.isPresent()) {
            throw new RuntimeException("User already has active subscription");
        }

        // Create trial subscription
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = startDate.plusDays(trialDurationDays);

        Subscription trial = new Subscription();
        trial.setUser(user);
        trial.setType(SubscriptionType.TRIAL);
        trial.setStatus(SubscriptionStatus.ACTIVE);
        trial.setPriceInRsd(BigDecimal.ZERO); // Free trial
        trial.setStartDate(startDate);
        trial.setEndDate(endDate);
        trial.setActivatedAt(LocalDateTime.now());
        trial.setAutoRenew(false); // Trials don't auto-renew
        trial.setCreatedAt(LocalDateTime.now());

        trial = subscriptionRepository.save(trial);
        logger.info("Trial subscription created for user: {} valid until: {}",
                user.getEmail(), endDate);

        return trial;
    }

    /**
     * Process subscription payment and activate subscription
     * Used for renewing existing subscriptions
     */
    @Override
    public Subscription processSubscriptionPayment(User user, SubscriptionType type) {
        logger.info("Processing subscription payment for user: {} type: {}", user.getEmail(), type);

        // For renewals, cancel current subscription and create new one
        Optional<Subscription> currentSub = getUserActiveSubscription(user);
        if (currentSub.isPresent() && currentSub.get().getType() != SubscriptionType.TRIAL) {
            cancelSubscription(currentSub.get().getId(), user);
        }

        return createSubscription(user, type);
    }

    /**
     * Get all active subscriptions (admin function)
     */
    @Override
    public List<Subscription> getAllActiveSubscriptions() {
        logger.debug("Fetching all active subscriptions for admin");
        return subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
    }

    /**
     * Get the most recent subscription for every user (admin function)
     */
    @Override
    public List<Subscription> getLatestSubscriptionsForAllUsers() {
        logger.debug("Fetching latest subscriptions for all users for admin view");
        List<Subscription> subscriptions = subscriptionRepository.findLatestSubscriptionsForAllUsers();

        subscriptions.sort(Comparator.comparing(Subscription::getCreatedAt,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        return subscriptions;
    }

    /**
     * Count active subscriptions (admin analytics)
     */
    @Override
    public long getActiveSubscriptionsCount() {
        long count = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        logger.debug("Active subscriptions count: {}", count);
        return count;
    }

    /**
     * Expire overdue subscriptions - runs automatically every hour
     * This scheduled method finds and expires subscriptions past their end date
     */
    @Override
    @Scheduled(fixedRate = 3600000) // Every hour
    public void expireOverdueSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> overdueSubscriptions = subscriptionRepository
                .findActiveSubscriptionsExpiredBefore(now);

        if (!overdueSubscriptions.isEmpty()) {
            logger.info("Found {} overdue subscriptions to expire", overdueSubscriptions.size());

            for (Subscription subscription : overdueSubscriptions) {
                subscription.setStatus(SubscriptionStatus.EXPIRED);
                subscription.setUpdatedAt(LocalDateTime.now());
                subscriptionRepository.save(subscription);

                logger.info("Expired subscription: {} for user: {}",
                        subscription.getId(), subscription.getUser().getEmail());
            }
        }
    }

    /**
     * Renew subscription with payment processing
     */
    @Override
    public Subscription renewSubscription(Long subscriptionId) {
        logger.info("Renewing subscription: {}", subscriptionId);

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (!subscription.getAutoRenew()) {
            throw new RuntimeException("Subscription auto-renewal is disabled");
        }

        User user = subscription.getUser();
        SubscriptionType type = subscription.getType();

        // Create new subscription (which includes payment processing)
        return createSubscription(user, type);
    }

    /**
     * Calculate subscription price based on type
     */
    private BigDecimal getSubscriptionPrice(SubscriptionType type) {
        return switch (type) {
            case MONTHLY -> monthlyPriceRsd;
            case YEARLY -> yearlyPriceRsd;
            case TRIAL -> BigDecimal.ZERO;
        };
    }

    /**
     * Calculate subscription end date based on type
     */
    private LocalDateTime calculateEndDate(LocalDateTime startDate, SubscriptionType type) {
        return switch (type) {
            case MONTHLY -> startDate.plusMonths(1);
            case YEARLY -> startDate.plusYears(1);
            case TRIAL -> startDate.plusDays(trialDurationDays);
        };
    }
}