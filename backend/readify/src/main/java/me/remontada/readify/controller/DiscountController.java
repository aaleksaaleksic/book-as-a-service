package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Discount;
import me.remontada.readify.model.User;
import me.remontada.readify.security.MyUserDetails;
import me.remontada.readify.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1")
public class DiscountController {

    private final DiscountService discountService;

    @Autowired
    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    /**
     * PUBLIC ENDPOINT - Generate 10% discount code (available until Nov 10, 2025)
     * No authentication required
     */
    @PostMapping("/public/discount/generate")
    public ResponseEntity<Map<String, Object>> generatePublicDiscount(
            @RequestBody Map<String, String> request) {

        log.info("Public discount generation request for email: {}", request.get("email"));

        try {
            String email = request.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email je obavezan"
                ));
            }

            // Check if generator is still available
            if (!discountService.isPublicGeneratorAvailable()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Javni generator popust kodova je istekao. Dostupan je bio do 10. novembra 2025."
                ));
            }

            Discount discount = discountService.generatePublicDiscount(email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Kod za popust je uspešno generisan i poslat na vaš email!",
                    "discount", Map.of(
                            "code", discount.getCode(),
                            "percentage", discount.getDiscountPercentage(),
                            "expiresAt", discount.getExpiresAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. u HH:mm")),
                            "email", discount.getEmail()
                    )
            ));

        } catch (Exception e) {
            log.error("Failed to generate public discount", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * ADMIN ENDPOINT - Generate custom discount code
     */
    @PostMapping("/admin/discount/generate")
    @PreAuthorize("hasAuthority('CAN_MANAGE_PAYMENTS')")
    public ResponseEntity<Map<String, Object>> generateAdminDiscount(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        log.info("Admin discount generation request");

        try {
            User admin = getCurrentUser(authentication);
            String email = (String) request.get("email");
            Integer discountPercentage = Integer.valueOf(request.get("discountPercentage").toString());

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email je obavezan"
                ));
            }

            if (discountPercentage == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Procenat popusta je obavezan"
                ));
            }

            Discount discount = discountService.generateAdminDiscount(email, discountPercentage, admin);

            log.info("Admin {} generated discount code {} for {}", admin.getEmail(), discount.getCode(), email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Kod za popust je uspešno generisan i poslat na email!",
                    "discount", Map.of(
                            "code", discount.getCode(),
                            "percentage", discount.getDiscountPercentage(),
                            "expiresAt", discount.getExpiresAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. u HH:mm")),
                            "email", discount.getEmail(),
                            "createdBy", admin.getEmail()
                    )
            ));

        } catch (Exception e) {
            log.error("Failed to generate admin discount", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Validate discount code for specific email
     */
    @PostMapping("/discount/validate")
    public ResponseEntity<Map<String, Object>> validateDiscount(
            @RequestBody Map<String, String> request) {

        try {
            String code = request.get("code");
            String email = request.get("email");

            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "valid", false,
                        "message", "Kod za popust je obavezan"
                ));
            }

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "valid", false,
                        "message", "Email je obavezan"
                ));
            }

            var discountOpt = discountService.validateDiscount(code, email);

            if (discountOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "valid", false,
                        "message", "Nevažeći ili istekao kod za popust"
                ));
            }

            Discount discount = discountOpt.get();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "valid", true,
                    "message", "Kod je važeći",
                    "discount", Map.of(
                            "code", discount.getCode(),
                            "percentage", discount.getDiscountPercentage(),
                            "expiresAt", discount.getExpiresAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. u HH:mm"))
                    )
            ));

        } catch (Exception e) {
            log.error("Failed to validate discount", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "valid", false,
                    "message", "Greška prilikom validacije koda"
            ));
        }
    }

    /**
     * Use/consume a discount code
     */
    @PostMapping("/discount/use")
    public ResponseEntity<Map<String, Object>> useDiscount(
            @RequestBody Map<String, String> request) {

        try {
            String code = request.get("code");
            String email = request.get("email");

            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Kod za popust je obavezan"
                ));
            }

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email je obavezan"
                ));
            }

            discountService.useDiscount(code, email);

            log.info("Discount code {} successfully used by: {}", code, email);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Kod za popust je uspešno iskorišćen"
            ));

        } catch (Exception e) {
            log.error("Failed to use discount", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Check if public discount generator is available
     */
    @GetMapping("/public/discount/available")
    public ResponseEntity<Map<String, Object>> checkPublicGeneratorAvailability() {
        boolean available = discountService.isPublicGeneratorAvailable();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "available", available,
                "message", available
                        ? "Javni generator popust kodova je dostupan"
                        : "Javni generator popust kodova više nije dostupan"
        ));
    }

    /**
     * ADMIN ENDPOINT - Get all discount codes
     */
    @GetMapping("/admin/discounts")
    @PreAuthorize("hasAuthority('CAN_MANAGE_PAYMENTS')")
    public ResponseEntity<Map<String, Object>> getAllDiscounts(Authentication authentication) {
        log.info("Admin requesting all discount codes");

        try {
            var discounts = discountService.getAllDiscounts();

            var discountList = discounts.stream().map(discount -> {
                var map = new java.util.HashMap<String, Object>();
                map.put("id", discount.getId());
                map.put("code", discount.getCode());
                map.put("email", discount.getEmail());
                map.put("discountPercentage", discount.getDiscountPercentage());
                map.put("type", discount.getType().toString());
                map.put("isUsed", discount.getIsUsed());
                map.put("createdAt", discount.getCreatedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm")));
                map.put("expiresAt", discount.getExpiresAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm")));
                map.put("usedAt", discount.getUsedAt() != null
                        ? discount.getUsedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm"))
                        : null);
                map.put("createdBy", discount.getCreatedBy() != null ? discount.getCreatedBy().getEmail() : "PUBLIC");
                map.put("isExpired", discount.isExpired());
                map.put("isValid", discount.isValid());
                return map;
            }).toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "discounts", discountList,
                    "totalCount", discounts.size()
            ));

        } catch (Exception e) {
            log.error("Failed to fetch all discounts", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Greška pri učitavanju kodova za popust"
            ));
        }
    }

    private User getCurrentUser(Authentication authentication) {
        MyUserDetails userDetails = (MyUserDetails) authentication.getPrincipal();
        return userDetails.getUser();
    }
}
