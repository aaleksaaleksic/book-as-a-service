package me.remontada.readify.service;

import me.remontada.readify.model.Payment;
import me.remontada.readify.model.PaymentProvider;
import me.remontada.readify.model.Subscription;
import me.remontada.readify.model.User;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {

    // Mock payment processing
    Payment processMockPayment(User user, Subscription subscription, BigDecimal amount);

    // Payment history
    List<Payment> getUserPayments(User user);

    List<Payment> getSubscriptionPayments(Long subscriptionId);

    // Admin analytics
    BigDecimal getTotalRevenue();

    BigDecimal getRevenueForCurrentMonth();

    long getSuccessfulPaymentsCount();

    // Payment simulation
    Payment simulateSuccessfulPayment(User user, Subscription subscription, BigDecimal amount, PaymentProvider provider);

    Payment simulateFailedPayment(User user, Subscription subscription, BigDecimal amount, PaymentProvider provider);
}