package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.BulkEmailRequestDTO;
import me.remontada.readify.dto.response.BulkEmailResponseDTO;
import me.remontada.readify.service.EmailService;
import me.remontada.readify.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/email")
public class EmailController {

    private final EmailService emailService;
    private final UserService userService;

    @Autowired
    public EmailController(EmailService emailService, UserService userService) {
        this.emailService = emailService;
        this.userService = userService;
    }

    @PostMapping("/send-bulk")
    @PreAuthorize("hasAuthority('CAN_READ_USERS')")
    public ResponseEntity<BulkEmailResponseDTO> sendBulkEmail(
            @Valid @RequestBody BulkEmailRequestDTO request) {

        log.info("Bulk email request received for group: {}", request.getRecipientGroup());

        // Get recipient emails based on the group
        List<String> recipients;
        switch (request.getRecipientGroup()) {
            case ALL_USERS:
                recipients = userService.getAllUserEmails();
                break;
            case ACTIVE_USERS:
                recipients = userService.getActiveUserEmails();
                break;
            default:
                throw new IllegalArgumentException("Invalid recipient group");
        }

        if (recipients.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new BulkEmailResponseDTO("No recipients found", 0));
        }

        // Build HTML email content
        String htmlContent = buildEmailHtml(request.getSubject(), request.getContent());

        // Send bulk email
        emailService.sendBulkEmail(recipients, request.getSubject(), htmlContent);

        log.info("Bulk email sent to {} recipients", recipients.size());

        return ResponseEntity.ok(
                new BulkEmailResponseDTO(
                        "Emails sent successfully",
                        recipients.size()
                )
        );
    }

    @PostMapping("/test-renewal-reminder")
    public ResponseEntity<String> testRenewalReminder(
            @RequestParam String email,
            @RequestParam(defaultValue = "Test User") String userName) {

        log.info("Test renewal reminder request for: {}", email);

        try {
            // Send test email with sample data
            java.time.LocalDateTime expiryDate = java.time.LocalDateTime.now().plusDays(3);
            emailService.sendSubscriptionRenewalReminder(email, userName, "YEARLY", expiryDate);

            return ResponseEntity.ok("Test renewal reminder sent successfully to: " + email);
        } catch (Exception e) {
            log.error("Failed to send test renewal reminder", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to send email: " + e.getMessage());
        }
    }

    private String buildEmailHtml(String subject, String content) {
        return """
                <!DOCTYPE html>
                <html lang="sr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 20px;">
                                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #4F46E5 0%%, #6366F1 100%%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">Bookotecha</h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                                                %s
                                            </h2>

                                            <div style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">%s</div>
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
                """.formatted(subject, subject, content);
    }
}
