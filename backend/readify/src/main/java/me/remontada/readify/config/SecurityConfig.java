package me.remontada.readify.config;

import me.remontada.readify.security.JsonSecurityHandlers;
import me.remontada.readify.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JsonSecurityHandlers jsonSecurityHandlers;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          JsonSecurityHandlers jsonSecurityHandlers) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jsonSecurityHandlers = jsonSecurityHandlers;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless API
                .cors(Customizer.withDefaults()) // Enable CORS
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Stateless JWT
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jsonSecurityHandlers) // 401 handler
                        .accessDeniedHandler(jsonSecurityHandlers) // 403 handler
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers("/api/v1/users/register").permitAll()
                        .requestMatchers("/api/v1/users/verify-email").permitAll()
                        .requestMatchers("/api/v1/users/verify-phone").permitAll()
                        .requestMatchers("/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/logout").permitAll()

                        // Books - readable by everyone, but content access requires auth
                        .requestMatchers("/api/v1/books").permitAll() // Book listing
                        .requestMatchers("/api/v1/books/search").permitAll() // Search
                        .requestMatchers("/api/v1/books/categories").permitAll() // Categories
                        .requestMatchers("/api/v1/books/category/**").permitAll() // By category
                        .requestMatchers("/api/v1/books/author/**").permitAll() // By author
                        .requestMatchers("/api/v1/books/popular").permitAll() // Popular books
                        .requestMatchers("/api/v1/books/top-rated").permitAll() // Top rated
                        .requestMatchers("/api/v1/books/{id}").permitAll() // Book details

                        // Protected endpoints - require authentication
                        .requestMatchers("/api/v1/books/{id}/read").authenticated()
                        .requestMatchers("/api/v1/books").hasAuthority("CAN_CREATE_BOOKS")
                        .requestMatchers("/api/v1/users").hasAuthority("CAN_READ_USERS")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Add JWT filter

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000", // Next.js dev server
                "http://localhost:3001",
                "https://readify.com" // Production domain(TODO!)
        ));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight response for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}