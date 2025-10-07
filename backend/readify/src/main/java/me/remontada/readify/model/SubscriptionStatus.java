package me.remontada.readify.model;

public enum SubscriptionStatus {
    ACTIVE,
    PENDING,
    EXPIRED,
    CANCELED,
    SUSPENDED,       // Suspended (zbog neplaćanja)
    PAYMENT_FAILED
}