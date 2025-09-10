package me.remontada.readify.controller;

import me.remontada.readify.model.Payment;
import me.remontada.readify.model.User;
import me.remontada.readify.security.MyUserDetails;
import me.remontada.readify.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PaymentController - REST API for payment management
 *
 * User endpoints:
 * - GET /api/v1/payments/my - Get user's payment history
 * - GET /api/v1/payments/subscription/{id} - Get payments for specific subscription
 *
 * Admin endpoints:
 * - GET /api/v1/admin/payments/revenue - Get revenue analytics
 * - GET /api/v1/admin/payments/stats - Get payment statistics
 */
@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    @Autowired
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }


    @GetMapping("/payments/my")
    @PreAuthorize("hasAuthority('CAN_VIEW_SUBSCRIPTION')")
    public ResponseEntity<Map<String, Object>> getMyPayments(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.debug("Fetching payment history for user: {}", currentUser.getEmail());

            List<Payment> payments = paymentService.getUserPayments(currentUser);

            List<Map<String, Object>> paymentList = payments.stream()
                    .map(this::mapPaymentToResponse)
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "payments", paymentList,
                    "count", paymentList.size()
            ));

        } catch (Exception e) {
            logger.error("Failed to get user payments", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }


    @GetMapping("/payments/subscription/{subscriptionId}")
    @PreAuthorize("hasAuthority('CAN_VIEW_SUBSCRIPTION')")
    public ResponseEntity<Map<String, Object>> getSubscriptionPayments(
            @PathVariable Long subscriptionId,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.debug("Fetching payments for subscription: {} by user: {}", subscriptionId, currentUser.getEmail());

            List<Payment> payments = paymentService.getSubscriptionPayments(subscriptionId);

            // Filter payments to only show user's own payments (unless admin)
            if (!isAdmin(currentUser)) {
                payments = payments.stream()
                        .filter(payment -> payment.getUser().getId().equals(currentUser.getId()))
                        .toList();
            }

            List<Map<String, Object>> paymentList = payments.stream()
                    .map(this::mapPaymentToResponse)
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "payments", paymentList,
                    "subscriptionId", subscriptionId,
                    "count", paymentList.size()
            ));

        } catch (Exception e) {
            logger.error("Failed to get subscription payments", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ADMIN ENDPOINTS

    /**
     * Get revenue analytics (admin only)
     */
    @GetMapping("/admin/payments/revenue")
    @PreAuthorize("hasAuthority('CAN_MANAGE_PAYMENTS')")
    public ResponseEntity<Map<String, Object>> getRevenueAnalytics(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Admin {} fetching revenue analytics", currentUser.getEmail());

            BigDecimal totalRevenue = paymentService.getTotalRevenue();
            BigDecimal monthlyRevenue = paymentService.getRevenueForCurrentMonth();
            long successfulPayments = paymentService.getSuccessfulPaymentsCount();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "revenue", Map.of(
                            "totalRevenue", totalRevenue,
                            "monthlyRevenue", monthlyRevenue,
                            "successfulPaymentsCount", successfulPayments,
                            "currency", "RSD"
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get revenue analytics", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get detailed payment statistics (admin only)
     */
    @GetMapping("/admin/payments/stats")
    @PreAuthorize("hasAuthority('CAN_VIEW_ANALYTICS')")
    public ResponseEntity<Map<String, Object>> getPaymentStats(Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Admin {} fetching payment statistics", currentUser.getEmail());

            BigDecimal totalRevenue = paymentService.getTotalRevenue();
            BigDecimal monthlyRevenue = paymentService.getRevenueForCurrentMonth();
            long successfulPayments = paymentService.getSuccessfulPaymentsCount();

            // Calculate some additional metrics
            BigDecimal averagePayment = successfulPayments > 0 ?
                    totalRevenue.divide(BigDecimal.valueOf(successfulPayments), 2, BigDecimal.ROUND_HALF_UP) :
                    BigDecimal.ZERO;

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "stats", Map.of(
                            "totalRevenue", totalRevenue,
                            "monthlyRevenue", monthlyRevenue,
                            "successfulPayments", successfulPayments,
                            "averagePaymentAmount", averagePayment,
                            "currency", "RSD"
                    ),
                    "insights", Map.of(
                            "revenueGrowth", monthlyRevenue.compareTo(BigDecimal.ZERO) > 0 ? "positive" : "none",
                            "paymentSuccessRate", "95%", // From configuration
                            "primaryPaymentMethod", "NLB_PAY"
                    )
            ));

        } catch (Exception e) {
            logger.error("Failed to get payment stats", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Test payment simulation endpoint (admin only, for testing)
     */
    @PostMapping("/admin/payments/test")
    @PreAuthorize("hasAuthority('CAN_MANAGE_PAYMENTS')")
    public ResponseEntity<Map<String, Object>> testPaymentSimulation(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            User currentUser = getCurrentUser(authentication);
            logger.info("Admin {} testing payment simulation", currentUser.getEmail());

            String simulationType = (String) request.get("type"); // "success" or "failure"
            BigDecimal amount = new BigDecimal(request.get("amount").toString());

            Payment simulatedPayment;
            if ("success".equals(simulationType)) {
                simulatedPayment = paymentService.simulateSuccessfulPayment(
                        currentUser, null, amount, me.remontada.readify.model.PaymentProvider.NLB_PAY);
            } else {
                simulatedPayment = paymentService.simulateFailedPayment(
                        currentUser, null, amount, me.remontada.readify.model.PaymentProvider.NLB_PAY);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment simulation completed",
                    "payment", mapPaymentToResponse(simulatedPayment)
            ));

        } catch (Exception e) {
            logger.error("Failed to simulate payment", e);
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


    private boolean isAdmin(User user) {
        return user.getPermissions().contains(me.remontada.readify.model.Permission.CAN_UPDATE_USERS) ||
                user.getPermissions().contains(me.remontada.readify.model.Permission.CAN_MANAGE_PAYMENTS);
    }


    private Map<String, Object> mapPaymentToResponse(Payment payment) {
        Map<String, Object> response = new HashMap<>();

        response.put("id", payment.getId());
        response.put("amountInRsd", payment.getAmountInRsd());
        response.put("status", payment.getStatus());
        response.put("provider", payment.getProvider());
        response.put("externalTransactionId", payment.getExternalTransactionId() != null ? payment.getExternalTransactionId() : "");
        response.put("bankResponseCode", payment.getBankResponseCode() != null ? payment.getBankResponseCode() : "");
        response.put("bankResponseMessage", payment.getBankResponseMessage() != null ? payment.getBankResponseMessage() : "");
        response.put("paidAt", payment.getPaidAt());
        response.put("createdAt", payment.getCreatedAt());
        response.put("isSuccessful", payment.isSuccessful());
        response.put("subscriptionId", payment.getSubscription() != null ? payment.getSubscription().getId() : null);

        return response;
    }

}