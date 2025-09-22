package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.SubscriptionResponseDTO;
import me.remontada.readify.mapper.SubscriptionMapper;
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


@Slf4j
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
                    "trialDuration", trialDurationDays + " dana",
                    "subscription", SubscriptionMapper.toResponseDTO(trial)
            ));

        } catch (Exception e) {
            logger.error("Failed to create trial subscription for user", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Create paid subscription (monthly/yearly)
     */
    @PostMapping("/subscriptions/subscribe")
    @PreAuthorize("hasAuthority('CAN_SUBSCRIBE')")
    public ResponseEntity<Map<String, Object>> subscribe(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            String typeStr = request.get("type");

            SubscriptionType type = SubscriptionType.valueOf(typeStr.toUpperCase());
            logger.info("Creating {} subscription for user: {}", type, currentUser.getEmail());

            Subscription subscription = subscriptionService.processSubscriptionPayment(currentUser, type);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pretplata je uspešno aktivirana!",
                    "subscription", SubscriptionMapper.toResponseDTO(subscription)
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
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> getMySubscription(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            Optional<Subscription> subscriptionOpt = subscriptionService.getUserActiveSubscription(currentUser);

            if (subscriptionOpt.isPresent()) {
                SubscriptionResponseDTO subscriptionDTO = SubscriptionMapper.toResponseDTO(subscriptionOpt.get());

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "hasActiveSubscription", true,
                        "subscription", subscriptionDTO
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "hasActiveSubscription", false,
                        "message", "Nemate aktivnu pretplatu"
                ));
            }

        } catch (Exception e) {
            logger.error("Failed to get user subscription", e);
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
    @PreAuthorize("hasAuthority('CAN_READ_BOOKS')")
    public ResponseEntity<Map<String, Object>> getSubscriptionHistory(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            List<Subscription> subscriptions = subscriptionService.getUserSubscriptionHistory(currentUser);

            List<SubscriptionResponseDTO> subscriptionDTOs = SubscriptionMapper.toResponseDTOList(subscriptions);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "subscriptions", subscriptionDTOs
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
     * Cancel subscription
     */
    @PostMapping("/subscriptions/{id}/cancel")
    @PreAuthorize("hasAuthority('CAN_CANCEL_SUBSCRIPTION')")
    public ResponseEntity<Map<String, Object>> cancelSubscription(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Canceling subscription {} for user: {}", id, currentUser.getEmail());

            Subscription canceledSubscription = subscriptionService.cancelSubscription(id, currentUser);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Pretplata je otkazana",
                    "subscription", SubscriptionMapper.toResponseDTO(canceledSubscription)
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
                                "price", monthlyPriceRsd,
                                "currency", "RSD",
                                "period", "mesec"
                        ),
                        "yearly", Map.of(
                                "price", yearlyPriceRsd,
                                "currency", "RSD",
                                "period", "godina"
                        ),
                        "trial", Map.of(
                                "price", 0,
                                "currency", "RSD",
                                "duration", trialDurationDays + " dana"
                        )
                )
        ));
    }

    /**
     * ADMIN: Get all subscriptions
     */
    @GetMapping("/admin/subscriptions")
    @PreAuthorize("hasAuthority('CAN_MANAGE_SUBSCRIPTIONS')")
    public ResponseEntity<Map<String, Object>> getAllSubscriptions(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Admin {} requesting all subscriptions", currentUser.getEmail());

            List<Subscription> subscriptions = subscriptionService.getLatestSubscriptionsForAllUsers();

            List<SubscriptionResponseDTO> subscriptionDTOs = SubscriptionMapper.toResponseDTOList(subscriptions);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "subscriptions", subscriptionDTOs,
                    "totalCount", subscriptions.size()
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
     * ADMIN: Get subscription statistics
     */
    @GetMapping("/admin/subscriptions/stats")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getSubscriptionStats(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);

            long activeCount = subscriptionService.getActiveSubscriptionsCount();
            List<User> allUsers = userService.findAll();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "stats", Map.of(
                            "activeSubscriptions", activeCount,
                            "totalUsers", allUsers.size(),
                            "conversionRate", allUsers.size() > 0 ?
                                    (double) activeCount / allUsers.size() * 100 : 0.0
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


    private User getCurrentUser(Authentication authentication) {
        MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
        return userDetails.getUser();
    }

}