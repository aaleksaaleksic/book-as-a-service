package me.remontada.readify.dto.response;

import lombok.*;
import me.remontada.readify.model.SubscriptionStatus;
import me.remontada.readify.model.SubscriptionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class SubscriptionResponseDTO {

    private Long id;

    private SubscriptionType type;

    private SubscriptionStatus status;

    private BigDecimal priceInRsd;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime activatedAt;

    private LocalDateTime canceledAt;

    private Boolean autoRenew;

    private String paymentMethod;

    private String externalSubscriptionId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    private Long userId;

    private String userEmail;

    private String userName;

    private String userFirstName;

    private String userLastName;


    private Boolean isActive;

    /**
     * True if subscription is expired (endDate < now)
     */
    private Boolean isExpired;

    /**
     * Number of days remaining until expiration (0 if expired)
     */
    private Long daysRemaining;


    private Boolean isTrial;

    /**
     * True if subscription is canceled but still active until endDate
     */
    private Boolean isCanceled;

    /**
     * Human-readable status description
     */
    private String statusDescription;
}