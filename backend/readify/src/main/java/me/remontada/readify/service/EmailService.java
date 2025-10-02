package me.remontada.readify.service;

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
}
