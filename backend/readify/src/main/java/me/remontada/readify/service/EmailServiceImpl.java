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
}
