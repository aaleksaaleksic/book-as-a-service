package me.remontada.readify.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Autowired
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendVerificationEmail(String email, String code, String userName) {
        if (!emailEnabled) {
            log.warn("Email service is disabled. Verification code for {}: {}", email, code);
            return;
        }

        try {
            String subject = "Verifikujte vaš Bookotecha nalog";
            String htmlContent = buildVerificationEmailHtml(code, userName);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("Verification email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", email, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    @Override
    public void sendWelcomeEmail(String email, String userName) {
        if (!emailEnabled) {
            log.warn("Email service is disabled. Skipping welcome email for: {}", email);
            return;
        }

        try {
            String subject = "Dobrodošli u Bookotecha!";
            String htmlContent = buildWelcomeEmailHtml(userName);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("Welcome email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", email, e);
            // Don't throw exception for welcome email - it's not critical
        }
    }

    @Override
    public void sendPasswordResetEmail(String email, String resetToken, String userName) {
        if (!emailEnabled) {
            log.warn("Email service is disabled. Reset token for {}: {}", email, resetToken);
            return;
        }

        try {
            String subject = "Resetovanje lozinke - Bookotecha";
            String htmlContent = buildPasswordResetEmailHtml(resetToken, userName);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("Password reset email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    @Override
    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildVerificationEmailHtml(String code, String userName) {
        return """
                <!DOCTYPE html>
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verifikujte email</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #4F46E5 0%%, #6366F1 100%%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;"> Bookotecha</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                                Zdravo%s!
                                            </h2>

                                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Hvala što ste se registrovali na Bookotecha. Da biste završili registraciju, molimo vas da verifikujete vašu email adresu.
                                            </p>

                                            <p style="margin: 0 0 16px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Vaš verifikacioni kod je:
                                            </p>

                                            <!-- Verification Code Box -->
                                            <div style="background-color: #EEF2FF; border: 2px solid #4F46E5; border-radius: 8px; padding: 30px; text-align: center; margin: 24px 0;">
                                                <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #2563EB; font-family: 'Courier New', monospace;">
                                                    %s
                                                </div>
                                            </div>

                                            <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                                Ovaj kod je validan narednih 24 sata. Unesite ga na stranici za verifikaciju kako biste aktivirali vaš nalog.
                                            </p>

                                            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
                                                <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                                                    Ako niste tražili ovaj kod, molimo vas da ignorišete ovaj email.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                © 2025 Bookotecha. Sva prava zadržana.
                                            </p>
                                            <p style="margin: 8px 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                Vaša digitalna biblioteka na dlanu
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                userName != null && !userName.isEmpty() ? " " + userName : "",
                code
        );
    }

    private String buildWelcomeEmailHtml(String userName) {
        return """
                <!DOCTYPE html>
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Dobrodošli u Bookotecha</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #4F46E5 0%%, #6366F1 100%%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">🎉 Dobrodošli u Bookotecha!</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                                Zdravo %s!
                                            </h2>

                                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Čestitamo! Uspešno ste verifikovali vaš email i sada imate pristup celoj Bookotecha biblioteci.
                                            </p>

                                            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; margin: 24px 0;">
                                                <h3 style="margin: 0 0 12px; color: #4F46E5; font-size: 18px;">Šta možete da radite:</h3>
                                                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                                                    <li>Pregledajte knjige iz različitih žanrova</li>
                                                    <li>Čitajte knjige direktno iz pretraživača</li>
                                              
                                                </ul>
                                            </div>

                                            <p style="margin: 24px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Spremni ste da počnete svoje putovanje kroz svet knjiga!
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                © 2025 Bookotecha. Sva prava zadržana.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(userName != null && !userName.isEmpty() ? userName : "");
    }

    private String buildPasswordResetEmailHtml(String resetToken, String userName) {
        String resetUrl = "http://localhost:3000/auth/reset-password?token=" + resetToken;

        return """
                <!DOCTYPE html>
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Resetovanje lozinke</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #4F46E5 0%%, #6366F1 100%%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;"> Resetovanje lozinke</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                                Zdravo %s!
                                            </h2>

                                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Primili smo zahtev za resetovanje vaše lozinke. Kliknite na dugme ispod da kreirate novu lozinku:
                                            </p>

                                            <div style="text-align: center; margin: 32px 0;">
                                                <a href="%s" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                                    Resetuj lozinku
                                                </a>
                                            </div>

                                            <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                                Ovaj link je validan narednih 24 sata. Ako niste zatražili resetovanje lozinke, molimo vas da ignorišete ovaj email.
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                © 2025 Bookotecha. Sva prava zadržana.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                userName != null && !userName.isEmpty() ? userName : "",
                resetUrl
        );
    }

    @Override
    public void sendBulkEmail(List<String> recipients, String subject, String htmlContent) {
        if (!emailEnabled) {
            log.warn("Email service is disabled. Skipping bulk email send.");
            return;
        }

        if (recipients == null || recipients.isEmpty()) {
            log.warn("No recipients provided for bulk email");
            return;
        }

        int successCount = 0;
        int failureCount = 0;

        for (String recipient : recipients) {
            try {
                sendHtmlEmail(recipient, subject, htmlContent);
                successCount++;
                log.debug("Email sent successfully to: {}", recipient);
            } catch (Exception e) {
                failureCount++;
                log.error("Failed to send email to: {}", recipient, e);
            }
        }

        log.info("Bulk email completed. Success: {}, Failed: {}", successCount, failureCount);
    }

    @Override
    public void sendSubscriptionRenewalReminder(String email, String userName, String subscriptionType, java.time.LocalDateTime expiryDate) {
        if (!emailEnabled) {
            log.warn("Email service is disabled. Skipping subscription renewal reminder for: {}", email);
            return;
        }

        try {
            String subject = "Vaša pretplata ističe za 3 dana - Bookotecha";
            String htmlContent = buildSubscriptionRenewalReminderHtml(userName, subscriptionType, expiryDate);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("Subscription renewal reminder sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send subscription renewal reminder to: {}", email, e);
            // Don't throw exception - we don't want to stop the batch process
        }
    }

    private String buildSubscriptionRenewalReminderHtml(String userName, String subscriptionType, java.time.LocalDateTime expiryDate) {
        String subscriptionName = switch (subscriptionType) {
            case "SIX_MONTH" -> "6-mesečna";
            case "YEARLY" -> "Godišnja";
            default -> subscriptionType;
        };

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy. u HH:mm");
        String formattedExpiryDate = expiryDate.format(formatter);

        String renewalUrl = "http://localhost:3000/pricing";

        return """
                <!DOCTYPE html>
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Podsetnik za obnovu pretplate</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #4F46E5 0%%, #6366F1 100%%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">⏰ Podsetnik o pretplati</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                                Zdravo %s!
                                            </h2>

                                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Ovo je podsetnik da će vaša <strong>%s pretplata</strong> na Bookotecha platformi uskoro isteći.
                                            </p>

                                            <!-- Expiry Info Box -->
                                            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 4px;">
                                                <h3 style="margin: 0 0 12px; color: #B45309; font-size: 18px;">📅 Datum isteka pretplate:</h3>
                                                <p style="margin: 0; color: #92400E; font-size: 20px; font-weight: 600;">
                                                    %s
                                                </p>
                                                <p style="margin: 12px 0 0; color: #92400E; font-size: 14px;">
                                                    Pretplata vam ističe za <strong>3 dana</strong>.
                                                </p>
                                            </div>

                                            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; margin: 24px 0;">
                                                <h3 style="margin: 0 0 12px; color: #4F46E5; font-size: 18px;">Zašto obnoviti pretplatu?</h3>
                                                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                                                    <li>Neograničen pristup celoj biblioteci knjiga</li>
                                                    <li>Čitanje bez reklama na svim uređajima</li>
                                                    <li>Nove knjige svakog meseca</li>
                                                </ul>
                                            </div>

                                            <p style="margin: 24px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Kliknite na dugme ispod da obnovite vašu pretplatu i nastavite tamo gde ste stali:
                                            </p>

                                            <div style="text-align: center; margin: 32px 0;">
                                                <a href="%s" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                                    Obnovi pretplatu
                                                </a>
                                            </div>

                                            <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                                Ako ne želite da obnovite pretplatu, vaš pristup će automatski biti prekinut nakon isteka perioda. Uvek možete da se vratite kasnije!
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                © 2025 Bookotecha. Sva prava zadržana.
                                            </p>
                                            <p style="margin: 8px 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                Vaša digitalna biblioteka na dlanu
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                userName != null && !userName.isEmpty() ? userName : "",
                subscriptionName,
                formattedExpiryDate,
                renewalUrl
        );
    }

    @Override
    public void sendDiscountCode(String email, String code, Integer discountPercentage, java.time.LocalDateTime expiresAt) {
        if (!emailEnabled) {
            log.warn("Email service is disabled. Discount code for {}: {}", email, code);
            return;
        }

        try {
            String subject = "Vaš Bookotecha kod za popust - " + discountPercentage + "%";
            String htmlContent = buildDiscountCodeEmailHtml(email, code, discountPercentage, expiresAt);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("Discount code email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send discount code email to: {}", email, e);
            throw new RuntimeException("Failed to send discount code email", e);
        }
    }

    private String buildDiscountCodeEmailHtml(String email, String code, Integer discountPercentage, java.time.LocalDateTime expiresAt) {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy. u HH:mm");
        String formattedExpiryDate = expiresAt.format(formatter);
        String pricingUrl = "http://localhost:3000/pricing";

        return """
                <!DOCTYPE html>
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Vaš kod za popust</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #10B981 0%%, #059669 100%%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">🎁 Vaš kod za popust!</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                                Čestitamo!
                                            </h2>

                                            <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                Dobili ste kod za <strong style="color: #10B981;">%d%% popusta</strong> na Bookotecha pretplatu!
                                            </p>

                                            <!-- Discount Code Box -->
                                            <div style="background: linear-gradient(135deg, #ECFDF5 0%%, #D1FAE5 100%%); border: 3px dashed #10B981; border-radius: 12px; padding: 30px; text-align: center; margin: 32px 0;">
                                                <p style="margin: 0 0 12px; color: #059669; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                                                    Vaš kod za popust
                                                </p>
                                                <div style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #047857; font-family: 'Courier New', monospace; margin: 12px 0;">
                                                    %s
                                                </div>
                                                <p style="margin: 12px 0 0; color: #059669; font-size: 18px; font-weight: 600;">
                                                    %d%% popusta
                                                </p>
                                            </div>

                                            <!-- Important Info Box -->
                                            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 4px;">
                                                <h3 style="margin: 0 0 12px; color: #B45309; font-size: 16px;">⏰ Važne informacije:</h3>
                                                <ul style="margin: 0; padding-left: 20px; color: #92400E; font-size: 14px; line-height: 1.8;">
                                                    <li>Kod važi samo za email adresu: <strong>%s</strong></li>
                                                    <li>Kod možete iskoristiti samo <strong>jednom</strong></li>
                                                    <li>Kod ističe: <strong>%s</strong> (važi 5 dana)</li>
                                                </ul>
                                            </div>

                                            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; margin: 24px 0;">
                                                <h3 style="margin: 0 0 12px; color: #4F46E5; font-size: 18px;">Kako da iskoristim kod?</h3>
                                                <ol style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                                                    <li>Kliknite na dugme "Vidi planove" ispod</li>
                                                    <li>Izaberite željeni pretplatnički plan</li>
                                                    <li>Unesite kod <strong>%s</strong> pre plaćanja</li>
                                                    <li>Popust će automatski biti primenjen na cenu</li>
                                                </ol>
                                            </div>

                                            <div style="text-align: center; margin: 32px 0;">
                                                <a href="%s" style="display: inline-block; background-color: #10B981; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                                                    Vidi planove
                                                </a>
                                            </div>

                                            <p style="margin: 24px 0 0; color: #999999; font-size: 13px; line-height: 1.5; text-align: center;">
                                                Zapamtite ili sačuvajte ovaj kod jer vam je potreban prilikom plaćanja!
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                © 2025 Bookotecha. Sva prava zadržana.
                                            </p>
                                            <p style="margin: 8px 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                                Vaša digitalna biblioteka na dlanu
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                discountPercentage,
                code,
                discountPercentage,
                email,
                formattedExpiryDate,
                code,
                pricingUrl
        );
    }
}
