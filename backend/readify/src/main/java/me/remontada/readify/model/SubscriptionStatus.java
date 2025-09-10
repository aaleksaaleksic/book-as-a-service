package me.remontada.readify.model;

public enum SubscriptionStatus {
    ACTIVE,
    PENDING,
    EXPIRED,
    CANCELED,
    TRIAL,
    SUSPENDED,       // Suspended (zbog neplaćanja)
    PAYMENT_FAILED
}