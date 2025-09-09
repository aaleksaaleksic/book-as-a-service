package me.remontada.readify.model


import jakarta.persistence.*;
import me.remontada.readify.model.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    private Subscription subscription;

    @Column(nullable = false)
    private BigDecimal amountInRsd;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status; // PENDING, COMPLETED, FAILED

    @Enumerated(EnumType.STRING)
    private PaymentProvider provider;

    @Column
    private String externalTransactionId; // ID transakcije od banke

    @Column
    private String bankResponseCode;

    @Column
    private LocalDateTime paidAt;
}