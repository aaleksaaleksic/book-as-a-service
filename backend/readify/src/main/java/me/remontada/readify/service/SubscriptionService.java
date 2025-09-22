package me.remontada.readify.service;

import me.remontada.readify.model.Subscription;
import me.remontada.readify.model.SubscriptionType;
import me.remontada.readify.model.User;

import java.util.List;
import java.util.Optional;

public interface SubscriptionService {

    // Subscription management
    Subscription createSubscription(User user, SubscriptionType type);

    Optional<Subscription> getUserActiveSubscription(User user);

    List<Subscription> getUserSubscriptionHistory(User user);

    Subscription cancelSubscription(Long subscriptionId, User user);

    boolean hasActiveSubscription(User user);

    // Trial management
    Subscription createTrialSubscription(User user);

    // Mock payment processing
    Subscription processSubscriptionPayment(User user, SubscriptionType type);

    // Admin functions
    List<Subscription> getAllActiveSubscriptions();

    List<Subscription> getLatestSubscriptionsForAllUsers();

    long getActiveSubscriptionsCount();

    void expireOverdueSubscriptions();

    // Subscription renewal
    Subscription renewSubscription(Long subscriptionId);
}