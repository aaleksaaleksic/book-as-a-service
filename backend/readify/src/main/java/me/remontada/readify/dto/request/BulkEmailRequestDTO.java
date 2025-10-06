package me.remontada.readify.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailRequestDTO {

    @NotNull(message = "Recipient group is required")
    private RecipientGroup recipientGroup;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Content is required")
    private String content;

    public enum RecipientGroup {
        ALL_USERS,
        ACTIVE_USERS
    }
}
