package me.remontada.readify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import me.remontada.readify.model.PaymentProvider;
import me.remontada.readify.model.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {

    private Long id;
    private BigDecimal amountInRsd;
    private PaymentStatus status;
    private PaymentProvider provider;
    private String externalTransactionId;
    private String bankResponseCode;
    private String bankResponseMessage;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;

    private Long userId;
    private String userEmail;
    private String userName;

    private Long subscriptionId;
    private String subscriptionType;
    private String subscriptionStatus;

    private Boolean isSuccessful;
    private Boolean isPending;
}