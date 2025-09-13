package me.remontada.readify.controller;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.PaymentResponseDTO;
import me.remontada.readify.model.Payment;
import me.remontada.readify.model.Subscription;
import me.remontada.readify.model.User;

@UtilityClass
@Slf4j
public class PaymentMapper {

    public static PaymentResponseDTO toResponseDTO(Payment payment) {
        if (payment == null) {
            return null;
        }

        try {
            return PaymentResponseDTO.builder()
                    .id(payment.getId())
                    .amountInRsd(payment.getAmountInRsd())
                    .status(payment.getStatus())
                    .provider(payment.getProvider())
                    .externalTransactionId(payment.getExternalTransactionId())
                    .bankResponseCode(payment.getBankResponseCode())
                    .bankResponseMessage(payment.getBankResponseMessage())
                    .paidAt(payment.getPaidAt())
                    .createdAt(payment.getCreatedAt())

                    // HIBERNATE PROXY SAFE extractions
                    .userId(extractUserId(payment.getUser()))
                    .userEmail(extractUserEmail(payment.getUser()))
                    .userName(extractUserName(payment.getUser()))
                    .subscriptionId(extractSubscriptionId(payment.getSubscription()))
                    .subscriptionType(extractSubscriptionType(payment.getSubscription()))
                    .subscriptionStatus(extractSubscriptionStatus(payment.getSubscription()))

                    // Computed fields
                    .isSuccessful(payment.isSuccessful())
                    .isPending(payment.isPending())
                    .build();

        } catch (Exception e) {
            log.error("Error mapping Payment to DTO for ID: {}", payment.getId(), e);
            return createFallbackDTO(payment);
        }
    }

    // SAFE extraction methods for User
    private static Long extractUserId(User user) {
        try {
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String extractUserEmail(User user) {
        try {
            return user != null ? user.getEmail() : "unknown@example.com";
        } catch (Exception e) {
            return "unknown@example.com";
        }
    }

    private static String extractUserName(User user) {
        try {
            return user != null ? user.getFullName() : "Unknown User";
        } catch (Exception e) {
            return "Unknown User";
        }
    }

    // SAFE extraction methods for Subscription
    private static Long extractSubscriptionId(Subscription subscription) {
        try {
            return subscription != null ? subscription.getId() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static String extractSubscriptionType(Subscription subscription) {
        try {
            return subscription != null ? subscription.getType().toString() : "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    private static String extractSubscriptionStatus(Subscription subscription) {
        try {
            return subscription != null ? subscription.getStatus().toString() : "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    private static PaymentResponseDTO createFallbackDTO(Payment payment) {
        return PaymentResponseDTO.builder()
                .id(payment.getId())
                .amountInRsd(payment.getAmountInRsd())
                .status(payment.getStatus())
                .userEmail("unknown@example.com")
                .userName("Unknown User")
                .build();
    }
}