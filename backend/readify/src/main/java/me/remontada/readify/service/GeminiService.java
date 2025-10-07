package me.remontada.readify.service;

public interface GeminiService {

    /**
     * Send a message to Gemini AI and get a response
     * @param userMessage The user's question or request
     * @param context Optional context to help the AI understand better
     * @return AI response
     */
    String chat(String userMessage, String context);
}
