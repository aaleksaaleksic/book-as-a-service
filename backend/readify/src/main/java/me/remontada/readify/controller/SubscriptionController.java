package me.remontada.readify.controller;

import me.remontada.readify.model.Permission;
import me.remontada.readify.model.Subscription;
import me.remontada.readify.model.SubscriptionType;
import me.remontada.readify.model.User;
import me.remontada.readify.security.MyUserDetails;
import me.remontada.readify.service.SubscriptionService;
import me.remontada.readify.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * SubscriptionController - REST API for subscription management
 *
 * Endpoints:
 * - POST /api/v1/subscriptions/trial - Create free trial
 * - POST /api/v1/subscriptions/subscribe - Create paid subscription
 * - GET /api/v1/subscriptions/my - Get user's current subscription
 * - GET /api/v1/subscriptions/history - Get user's subscription history
 * - POST /api/v1/subscriptions/{id}/cancel - Cancel subscription
 * - GET /api/v1/subscriptions/pricing - Get current pricing
 *
 * Admin endpoints:
 * - GET /api/v1/admin/subscriptions - Get all subscriptions
 * - GET /api/v1/admin/subscriptions/stats - Get subscription analytics
 */
@RestController
@RequestMapping("/api/v1")
public class SubscriptionController {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionController.class);

    private final SubscriptionService subscriptionService;
    private final UserService userService;

    @Value("${readify.subscription.monthly-price:999}")
    private BigDecimal monthlyPriceRsd;

    @Value("${readify.subscription.yearly-price:9999}")
    private BigDecimal yearlyPriceRsd;

    @Value("${readify.subscription.trial-duration-days:7}")
    private int trialDurationDays;

    @Autowired
    public SubscriptionController(SubscriptionService subscriptionService, UserService userService) {
        this.subscriptionService = subscriptionService;
        this.userService = userService;
    }

    /**
     * Create free trial subscription (7 days)
     * Available to users who haven't used trial before
     */
    @PostMapping("/subscriptions/trial")
    @PreAuthorize("hasAuthority('CAN_SUBSCRIBE')")
    public ResponseEntity<Map<String, Object>> createTrialSubscription(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Creating trial subscription for user: {}", currentUser.getEmail());

            Subscription trial = subscriptionService.createTrialSubscription(currentUser);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Besplatni trial je aktiviran!",
                    "subscription", Map.of(
                            "id", trial.getId(),
                            "type", trial.getType(),
                            "status", trial.getStatus(),
                            "startDate", trial.getStartDate(),
                            "endDate", trial.getEndDate(),
                            "daysRemaining", trial.getDaysRemaining()
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to create trial subscription", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Create paid subscription (monthly or yearly)
     * Processes payment and activates subscription
     */
    @PostMapping("/subscriptions/subscribe")
    @PreAuthorize("hasAuthority('CAN_SUBSCRIBE')")
    public ResponseEntity<Map<String, Object>> createSubscription(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            String typeStr = (String) request.get("type");

            SubscriptionType type;
            try {
                type = SubscriptionType.valueOf(typeStr.toUpperCase());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Nevaljan tip pretplate. Dozvoljeni tipovi: MONTHLY, YEARLY"
                ));
            }

            if (type == SubscriptionType.TRIAL) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Koristite /trial endpoint za kreiranje trial pretplate"
                ));
            }

            logger.info("Creating {} subscription for user: {}", type, currentUser.getEmail());

            Subscription subscription = subscriptionService.createSubscription(currentUser, type);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pretplata je uspešno kreirana i aktivirana!",
                    "subscription", Map.of(
                            "id", subscription.getId(),
                            "type", subscription.getType(),
                            "status", subscription.getStatus(),
                            "priceInRsd", subscription.getPriceInRsd(),
                            "startDate", subscription.getStartDate(),
                            "endDate", subscription.getEndDate(),
                            "daysRemaining", subscription.getDaysRemaining()
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to create subscription", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get user's current active subscription
     */
    @GetMapping("/subscriptions/my")
    @PreAuthorize("hasAuthority('CAN_VIEW_SUBSCRIPTION')")
    public ResponseEntity<Map<String, Object>> getCurrentSubscription(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            Optional<Subscription> subscription = subscriptionService.getUserActiveSubscription(currentUser);

            if (subscription.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "hasActiveSubscription", false,
                        "message", "Nemate aktivnu pretplatu"
                ));
            }

            Subscription sub = subscription.get();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "hasActiveSubscription", true,
                    "subscription", Map.of(
                            "id", sub.getId(),
                            "type", sub.getType(),
                            "status", sub.getStatus(),
                            "priceInRsd", sub.getPriceInRsd(),
                            "startDate", sub.getStartDate(),
                            "endDate", sub.getEndDate(),
                            "daysRemaining", sub.getDaysRemaining(),
                            "autoRenew", sub.getAutoRenew()
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get current subscription", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get user's subscription history
     */
    @GetMapping("/subscriptions/history")
    @PreAuthorize("hasAuthority('CAN_VIEW_SUBSCRIPTION')")
    public ResponseEntity<Map<String, Object>> getSubscriptionHistory(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            List<Subscription> history = subscriptionService.getUserSubscriptionHistory(currentUser);

            List<Map<String, Object>> subscriptions = history.stream()
                    .map(this::mapSubscriptionToResponse)
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "subscriptions", subscriptions,
                    "count", subscriptions.size()
            ));

        } catch (Exception e) {
            logger.error("Failed to get subscription history", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Cancel user's active subscription
     */
    @PostMapping("/subscriptions/{id}/cancel")
    @PreAuthorize("hasAuthority('CAN_CANCEL_SUBSCRIPTION')")
    public ResponseEntity<Map<String, Object>> cancelSubscription(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Canceling subscription: {} for user: {}", id, currentUser.getEmail());

            Subscription canceledSubscription = subscriptionService.cancelSubscription(id, currentUser);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pretplata je otkazana. Pristup je zadržan do: " + canceledSubscription.getEndDate(),
                    "subscription", mapSubscriptionToResponse(canceledSubscription)
            ));

        } catch (Exception e) {
            logger.error("Failed to cancel subscription", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get current pricing information
     */
    @GetMapping("/subscriptions/pricing")
    public ResponseEntity<Map<String, Object>> getPricing() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "pricing", Map.of(
                        "monthly", Map.of(
                                "priceInRsd", monthlyPriceRsd,
                                "description", "Mesečna pretplata",
                                "duration", "30 dana"
                        ),
                        "yearly", Map.of(
                                "priceInRsd", yearlyPriceRsd,
                                "description", "Godišnja pretplata",
                                "duration", "365 dana",
                                "savings", monthlyPriceRsd.multiply(BigDecimal.valueOf(12)).subtract(yearlyPriceRsd)
                        ),
                        "trial", Map.of(
                                "priceInRsd", BigDecimal.ZERO,
                                "description", "Besplatni trial",
                                "duration", trialDurationDays + " dana"
                        )
                ),
                "currency", "RSD"
        ));
    }

    // ADMIN ENDPOINTS

    /**
     * Get all active subscriptions (admin only)
     */
    @GetMapping("/admin/subscriptions")
    @PreAuthorize("hasAuthority('CAN_MANAGE_USERS')")
    public ResponseEntity<Map<String, Object>> getAllSubscriptions(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Admin {} fetching all subscriptions", currentUser.getEmail());

            List<Subscription> subscriptions = subscriptionService.getAllActiveSubscriptions();

            List<Map<String, Object>> subscriptionList = subscriptions.stream()
                    .map(sub -> {
                        Map<String, Object> subMap = mapSubscriptionToResponse(sub);
                        subMap.put("userEmail", sub.getUser().getEmail());
                        subMap.put("userName", sub.getUser().getFirstName() + " " + sub.getUser().getLastName());
                        return subMap;
                    })
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "subscriptions", subscriptionList,
                    "count", subscriptionList.size()
            ));

        } catch (Exception e) {
            logger.error("Failed to get all subscriptions", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get subscription analytics (admin only)
     */
    @GetMapping("/admin/subscriptions/stats")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getSubscriptionStats(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Admin {} fetching subscription stats", currentUser.getEmail());

            long activeCount = subscriptionService.getActiveSubscriptionsCount();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "stats", Map.of(
                            "activeSubscriptions", activeCount,
                            "totalUsers", userService.findAll().size(),
                            "subscriptionRate", activeCount > 0 ?
                                    (double) activeCount / userService.findAll().size() * 100 : 0.0
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get subscription stats", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Helper method to get current user from authentication
     */
    private User getCurrentUser(Authentication authentication) {
        MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
        return userDetails.getUser();
    }

    /**
     * Helper method to map Subscription entity to response format
     */
    private Map<String, Object> mapSubscriptionToResponse(Subscription subscription) {
        return Map.of(
                "id", subscription.getId(),
                "type", subscription.getType(),
                "status", subscription.getStatus(),
                "priceInRsd", subscription.getPriceInRsd(),
                "startDate", subscription.getStartDate(),
                "endDate", subscription.getEndDate(),
                "daysRemaining", subscription.getDaysRemaining(),
                "autoRenew", subscription.getAutoRenew(),
                "createdAt", subscription.getCreatedAt(),
                "canceledAt", subscription.getCanceledAt()
        );
    }
}