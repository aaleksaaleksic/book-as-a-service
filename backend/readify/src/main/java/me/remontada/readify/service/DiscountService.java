package me.remontada.readify.service;

import me.remontada.readify.model.Discount;
import me.remontada.readify.model.User;

import java.util.List;
import java.util.Optional;

public interface DiscountService {

    /**
     * Generate a public discount code (10% fixed)
     * Available until November 10, 2025
     */
    Discount generatePublicDiscount(String email);

    /**
     * Generate an admin discount code (custom percentage)
     */
    Discount generateAdminDiscount(String email, Integer discountPercentage, User admin);

    /**
     * Validate a discount code for a specific email
     */
    Optional<Discount> validateDiscount(String code, String email);

    /**
     * Mark a discount code as used
     */
    void useDiscount(String code, String email);

    /**
     * Check if public discount generator is still available
     */
    boolean isPublicGeneratorAvailable();

    /**
     * Clean up expired unused discounts
     */
    void cleanupExpiredDiscounts();

    /**
     * Get all discount codes (admin only)
     */
    List<Discount> getAllDiscounts();
}
