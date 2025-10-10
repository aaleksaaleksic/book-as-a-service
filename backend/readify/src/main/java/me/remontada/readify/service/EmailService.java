package me.remontada.readify.service;

import java.util.List;

public interface EmailService {

    /**
     * Sends email verification code to the user
     * @param email User's email address
     * @param code Verification code
     * @param userName User's full name
     */
    void sendVerificationEmail(String email, String code, String userName);

    /**
     * Sends welcome email after successful verification
     * @param email User's email address
     * @param userName User's full name
     */
    void sendWelcomeEmail(String email, String userName);

    /**
     * Sends password reset email
     * @param email User's email address
     * @param resetToken Password reset token
     * @param userName User's full name
     */
    void sendPasswordResetEmail(String email, String resetToken, String userName);

    /**
     * Checks if email service is enabled and configured
     * @return true if email service is ready to send emails
     */
    boolean isEmailEnabled();

    /**
     * Sends bulk email to multiple recipients
     * @param recipients List of recipient email addresses
     * @param subject Email subject
     * @param htmlContent Email content in HTML format
     */
    void sendBulkEmail(List<String> recipients, String subject, String htmlContent);

    /**
     * Sends subscription renewal reminder email
     * @param email User's email address
     * @param userName User's full name
     * @param subscriptionType Type of subscription (SIX_MONTH or YEARLY)
     * @param expiryDate When the subscription expires
     */
    void sendSubscriptionRenewalReminder(String email, String userName, String subscriptionType, java.time.LocalDateTime expiryDate);

    /**
     * Sends discount code email
     * @param email User's email address
     * @param code Discount code
     * @param discountPercentage Discount percentage
     * @param expiresAt When the code expires
     */
    void sendDiscountCode(String email, String code, Integer discountPercentage, java.time.LocalDateTime expiresAt);
}

