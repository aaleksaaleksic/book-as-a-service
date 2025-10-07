package me.remontada.readify.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {

    /**
     * API key used to authenticate with the Gemini API. Can be supplied via the
     * gemini.api.key property or GOOGLE_API_KEY / GEMINI_API_KEY environment variables.
     */
    private String apiKey;

    /**
     * Gemini model name to use when generating responses.
     */
    private String model = "gemini-2.5-flash";

    /**
     * Resolve the API key taking into account the recommended GOOGLE_API_KEY env var
     * and the legacy GEMINI_API_KEY fallback.
     */
    public String resolveApiKey() {
        if (StringUtils.hasText(apiKey)) {
            System.out.println("DEBUG: Using API key from gemini.api.key property");
            return apiKey;
        }

        String googleApiKey = System.getenv("GOOGLE_API_KEY");
        System.out.println("DEBUG: GOOGLE_API_KEY env var: " + (googleApiKey != null ? "SET" : "NOT SET"));
        if (StringUtils.hasText(googleApiKey)) {
            return googleApiKey;
        }

        String geminiApiKey = System.getenv("GEMINI_API_KEY");
        System.out.println("DEBUG: GEMINI_API_KEY env var: " + (geminiApiKey != null ? "SET" : "NOT SET"));
        if (StringUtils.hasText(geminiApiKey)) {
            return geminiApiKey;
        }

        System.out.println("DEBUG: No API key found in any source");
        return null;
    }
}
