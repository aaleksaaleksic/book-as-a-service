package me.remontada.readify.mapper;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.response.SubscriptionResponseDTO;
import me.remontada.readify.model.Subscription;
import me.remontada.readify.model.SubscriptionStatus;
import me.remontada.readify.model.User;

import java.util.List;
import java.util.stream.Collectors;


@UtilityClass
@Slf4j
public class SubscriptionMapper {


    public static SubscriptionResponseDTO toResponseDTO(Subscription subscription) {
        if (subscription == null) {
            return null;
        }

        try {
            return SubscriptionResponseDTO.builder()
                    .id(subscription.getId())
                    .type(subscription.getType())
                    .status(subscription.getStatus())
                    .priceInRsd(subscription.getPriceInRsd())
                    .startDate(subscription.getStartDate())
                    .endDate(subscription.getEndDate())
                    .activatedAt(subscription.getActivatedAt())
                    .canceledAt(subscription.getCanceledAt())
                    .autoRenew(subscription.getAutoRenew())
                    .paymentMethod(subscription.getPaymentMethod())
                    .externalSubscriptionId(subscription.getExternalSubscriptionId())
                    .createdAt(subscription.getCreatedAt())
                    .updatedAt(subscription.getUpdatedAt())

                    .userId(extractUserId(subscription.getUser()))
                    .userEmail(extractUserEmail(subscription.getUser()))
                    .userName(extractUserName(subscription.getUser()))
                    .userFirstName(extractUserFirstName(subscription.getUser()))
                    .userLastName(extractUserLastName(subscription.getUser()))

                    .isActive(computeIsActive(subscription))
                    .isExpired(computeIsExpired(subscription))
                    .daysRemaining(computeDaysRemaining(subscription))
                    .isTrial(computeIsTrial(subscription))
                    .isCanceled(computeIsCanceled(subscription))
                    .statusDescription(computeStatusDescription(subscription))
                    .build();

        } catch (Exception e) {
            log.error("Error mapping Subscription to DTO for ID: {}", subscription.getId(), e);
            return createFallbackDTO(subscription);
        }
    }


    public static List<SubscriptionResponseDTO> toResponseDTOList(List<Subscription> subscriptions) {
        if (subscriptions == null) {
            return List.of();
        }

        return subscriptions.stream()
                .map(SubscriptionMapper::toResponseDTO)
                .collect(Collectors.toList());
    }


    private static Long extractUserId(User user) {
        try {
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            log.warn("Failed to extract User ID from Subscription", e);
            return null;
        }
    }

    private static String extractUserEmail(User user) {
        try {
            return user != null ? user.getEmail() : "unknown@example.com";
        } catch (Exception e) {
            log.warn("Failed to extract User email from Subscription", e);
            return "unknown@example.com";
        }
    }

    private static String extractUserName(User user) {
        try {
            return user != null ? user.getFullName() : "Unknown User";
        } catch (Exception e) {
            log.warn("Failed to extract User fullName from Subscription", e);
            return "Unknown User";
        }
    }

    private static String extractUserFirstName(User user) {
        try {
            return user != null ? user.getFirstName() : "Unknown";
        } catch (Exception e) {
            log.warn("Failed to extract User firstName from Subscription", e);
            return "Unknown";
        }
    }

    private static String extractUserLastName(User user) {
        try {
            return user != null ? user.getLastName() : "";
        } catch (Exception e) {
            log.warn("Failed to extract User lastName from Subscription", e);
            return "";
        }
    }


    private static Boolean computeIsActive(Subscription subscription) {
        try {
            return subscription != null ? subscription.isActive() : false;
        } catch (Exception e) {
            log.warn("Failed to compute isActive for Subscription", e);
            return false;
        }
    }

    private static Boolean computeIsExpired(Subscription subscription) {
        try {
            return subscription != null ? subscription.isExpired() : true;
        } catch (Exception e) {
            log.warn("Failed to compute isExpired for Subscription", e);
            return true;
        }
    }

    private static Long computeDaysRemaining(Subscription subscription) {
        try {
            return subscription != null ? subscription.getDaysRemaining() : 0L;
        } catch (Exception e) {
            log.warn("Failed to compute daysRemaining for Subscription", e);
            return 0L;
        }
    }

    private static Boolean computeIsTrial(Subscription subscription) {
        try {
            return subscription != null && subscription.getStatus() == SubscriptionStatus.TRIAL;
        } catch (Exception e) {
            log.warn("Failed to compute isTrial for Subscription", e);
            return false;
        }
    }

    private static Boolean computeIsCanceled(Subscription subscription) {
        try {
            return subscription != null && subscription.getCanceledAt() != null;
        } catch (Exception e) {
            log.warn("Failed to compute isCanceled for Subscription", e);
            return false;
        }
    }

    private static String computeStatusDescription(Subscription subscription) {
        try {
            if (subscription == null || subscription.getStatus() == null) {
                return "Unknown Status";
            }

            switch (subscription.getStatus()) {
                case ACTIVE:
                    if (subscription.getDaysRemaining() <= 7) {
                        return "Active - Expires Soon";
                    }
                    return "Active";
                case TRIAL:
                    return "Trial Period - " + subscription.getDaysRemaining() + " days left";
                case EXPIRED:
                    return "Expired";
                case CANCELED:
                    return subscription.isActive() ? "Canceled - Active until " +
                            subscription.getEndDate().toLocalDate() : "Canceled";
                case SUSPENDED:
                    return "Suspended - Payment Issue";
                case PAYMENT_FAILED:
                    return "Payment Failed";
                case PENDING:
                    return "Pending Activation";
                default:
                    return subscription.getStatus().toString();
            }
        } catch (Exception e) {
            log.warn("Failed to compute statusDescription for Subscription", e);
            return "Unknown Status";
        }
    }


    private static SubscriptionResponseDTO createFallbackDTO(Subscription subscription) {
        Long safeId = null;
        try {
            safeId = subscription.getId();
        } catch (Exception ignored) {
            // ID extraction failed - proceed with null
        }

        return SubscriptionResponseDTO.builder()
                .id(safeId)
                .type(null)
                .status(SubscriptionStatus.EXPIRED)
                .priceInRsd(java.math.BigDecimal.ZERO)
                .startDate(null)
                .endDate(null)
                .activatedAt(null)
                .canceledAt(null)
                .autoRenew(false)
                .paymentMethod("Unknown")
                .externalSubscriptionId(null)
                .createdAt(null)
                .updatedAt(null)

                .userId(null)
                .userEmail("unknown@example.com")
                .userName("Unknown User")
                .userFirstName("Unknown")
                .userLastName("")

                .isActive(false)
                .isExpired(true)
                .daysRemaining(0L)
                .isTrial(false)
                .isCanceled(false)
                .statusDescription("Error Loading Subscription")
                .build();
    }
}