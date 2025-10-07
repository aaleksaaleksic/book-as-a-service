package me.remontada.readify.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatResponse {

    private String response;
    private boolean success;
    private String error;

    public static AiChatResponse success(String response) {
        return AiChatResponse.builder()
                .response(response)
                .success(true)
                .build();
    }

    public static AiChatResponse error(String error) {
        return AiChatResponse.builder()
                .error(error)
                .success(false)
                .build();
    }
}
