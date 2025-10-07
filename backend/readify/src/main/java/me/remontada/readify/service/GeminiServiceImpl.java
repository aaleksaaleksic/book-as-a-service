package me.remontada.readify.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

    private Client client;

    private Client getClient() {
        if (client == null) {
            // Create client with API key from Spring config
            client = Client.builder()
                    .apiKey(apiKey)
                    .build();
            log.info("Gemini client initialized with model: {}", modelName);
        }
        return client;
    }

    @Override
    public String chat(String userMessage, String context) {
        try {
            log.info("Sending message to Gemini AI: {}", userMessage.substring(0, Math.min(50, userMessage.length())));

            // Build the full prompt with context if provided
            String fullPrompt = buildPrompt(userMessage, context);

            // Generate response
            GenerateContentResponse response = getClient()
                    .models
                    .generateContent(modelName, fullPrompt, null);

            String aiResponse = response.text();
            log.info("Received response from Gemini AI: {} characters", aiResponse.length());

            return aiResponse;

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
