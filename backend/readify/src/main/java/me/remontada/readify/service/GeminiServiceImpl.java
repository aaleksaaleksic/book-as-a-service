package me.remontada.readify.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.config.GeminiProperties;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {

    private final GeminiProperties geminiProperties;

    private Client client;

    public GeminiServiceImpl(GeminiProperties geminiProperties) {
        this.geminiProperties = geminiProperties;
    }

    private synchronized Client getClient() {
        if (client == null) {
            String resolvedApiKey = geminiProperties.resolveApiKey();
            if (!StringUtils.hasText(resolvedApiKey)) {
                throw new IllegalStateException("Gemini API key is not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY.");
            }

            client = Client.builder()
                    .apiKey(resolvedApiKey)
                    .build();
            log.info("Gemini client initialized with model: {}", geminiProperties.getModel());
        }
        return client;
    }

    @Override
    public String chat(String userMessage, String context) {
        if (!StringUtils.hasText(userMessage)) {
            throw new IllegalArgumentException("User message must not be blank");
        }

        try {
            log.info("Sending message to Gemini AI: {}", userMessage.substring(0, Math.min(50, userMessage.length())));

            // Build the full prompt with context if provided
            String fullPrompt = buildPrompt(userMessage, context);

            // Generate response
            GenerateContentResponse response = getClient()
                    .models
                    .generateContent(geminiProperties.getModel(), fullPrompt, null);

            String aiResponse = response.text();
            if (!StringUtils.hasText(aiResponse)) {
                log.warn("Gemini returned an empty response");
                throw new RuntimeException("Received empty response from Gemini API");
            }

            log.info("Received response from Gemini AI: {} characters", aiResponse.length());

            return aiResponse;

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling Gemini AI: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get response from AI: " + e.getMessage());
        }
    }

    private String buildPrompt(String userMessage, String context) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are a helpful AI assistant for a digital book reading platform. ");
        prompt.append("Your role is to help users understand book content, explain code examples, ");
        prompt.append("summarize passages, and answer questions about what they're reading.\n\n");

        if (context != null && !context.isBlank()) {
            prompt.append("Book context:\n");
            prompt.append(context);
            prompt.append("\n\n");
        }

        prompt.append("User question: ");
        prompt.append(userMessage);

        return prompt.toString();
    }
}
