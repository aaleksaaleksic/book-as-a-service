package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.AiChatRequest;
import me.remontada.readify.dto.response.AiChatResponse;
import me.remontada.readify.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai-chat")
public class AiChatController {

    private final GeminiService geminiService;

    @Autowired
    public AiChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * Send a message to the AI assistant
     * POST /api/v1/ai-chat/ask
     */
    @PostMapping("/ask")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiChatResponse> askQuestion(@Valid @RequestBody AiChatRequest request) {
        try {
            log.info("Received AI chat request from authenticated user");

            String response = geminiService.chat(request.getMessage(), request.getBookContext());

            return ResponseEntity.ok(AiChatResponse.success(response));

        } catch (Exception e) {
            log.error("Error processing AI chat request", e);
            return ResponseEntity
                    .status(500)
                    .body(AiChatResponse.error("Failed to get AI response. Please try again."));
        }
    }

    /**
     * Health check endpoint to verify AI service is available
     * GET /api/v1/ai-chat/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Chat service is running");
    }
}
