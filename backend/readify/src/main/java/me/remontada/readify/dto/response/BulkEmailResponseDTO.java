package me.remontada.readify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailResponseDTO {
    private String message;
    private int recipientCount;
}
