package me.remontada.readify.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Column(nullable = false, name = "price_in_rsd")
    private BigDecimal priceInRsd;

    @Column(nullable = false, name = "start_date")
    private LocalDateTime startDate;

    @Column(nullable = false, name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(nullable = false, name = "auto_renew")
    private Boolean autoRenew = true;

    @Column(name = "payment_method")
    private String paymentMethod; // "NLB_PAY", "INTESA", etc.

    @Column(name = "external_subscription_id")
    private String externalSubscriptionId; // ID od banke/payment providera

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Helper methods
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE &&
                endDate.isAfter(LocalDateTime.now());
    }

    public boolean isExpired() {
        return endDate.isBefore(LocalDateTime.now());
    }

    public long getDaysRemaining() {
        if (isExpired()) return 0;
        return java.time.Duration.between(LocalDateTime.now(), endDate).toDays();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}