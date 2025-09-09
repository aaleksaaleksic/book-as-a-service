package me.remontada.readify.model;

public enum PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,         // Neuspešno plaćanje
    CANCELED,       // Otkazano plaćanje
    REFUNDED        // Refundirano
}