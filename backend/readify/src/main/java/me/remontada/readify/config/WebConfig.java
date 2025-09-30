package me.remontada.readify.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.ResourceRegionHttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
public class WebConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,HEAD}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:Authorization,Content-Type,Accept,X-Readify-Auth,X-Readify-Session,X-Readify-Watermark,X-Readify-Issued-At,Range,If-Range}")
    private String allowedHeaders;

    @Value("${cors.exposed-headers:Content-Disposition,Content-Length,Content-Range,Accept-Ranges,X-Readify-Watermark,X-Readify-Session,X-Readify-Issued-At}")
    private String exposedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] originsArray = allowedOrigins.split(",");
                String[] methodsArray = allowedMethods.split(",");
                String[] headersArray = allowedHeaders.split(",");
                String[] exposedHeadersArray = exposedHeaders.split(",");

                log.info("Configuring CORS with origins: {}", allowedOrigins);
                log.info("Allowed methods: {}", allowedMethods);
                log.info("Allowed headers: {}", allowedHeaders);
                log.info("Exposed headers: {}", exposedHeaders);

                registry.addMapping("/api/**")
                        .allowedOrigins(originsArray)
                        .allowedMethods(methodsArray)
                        .allowedHeaders(headersArray)
                        .exposedHeaders(exposedHeadersArray)
                        .allowCredentials(allowCredentials)
                        .maxAge(3600); // 1 hour preflight cache

                // Dodatno mapiranje za file endpoints
                registry.addMapping("/api/v1/files/**")
                        .allowedOrigins(originsArray)
                        .allowedMethods(methodsArray)
                        .allowedHeaders(headersArray)
                        .exposedHeaders(exposedHeadersArray)
                        .allowCredentials(allowCredentials)
                        .maxAge(3600);

                // Reader endpoint mapiranje
                registry.addMapping("/api/reader/**")
                        .allowedOrigins(originsArray)
                        .allowedMethods(methodsArray)
                        .allowedHeaders(headersArray)
                        .exposedHeaders(exposedHeadersArray)
                        .allowCredentials(allowCredentials)
                        .maxAge(3600);
            }

            @Override
            public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
                log.info("Adding ResourceRegionHttpMessageConverter with PDF support to existing converters");
                ResourceRegionHttpMessageConverter regionConverter = new ResourceRegionHttpMessageConverter();
                regionConverter.setSupportedMediaTypes(Arrays.asList(
                    MediaType.APPLICATION_PDF,
                    MediaType.APPLICATION_OCTET_STREAM,
                    MediaType.ALL
                ));
                converters.add(0, regionConverter); // Add as first priority
            }
        };
    }
}