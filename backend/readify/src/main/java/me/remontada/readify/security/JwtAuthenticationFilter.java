package me.remontada.readify.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import me.remontada.readify.model.User;
import me.remontada.readify.service.UserService;
import me.remontada.readify.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Autowired
    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String token = extractToken(request);

            if (token == null) {
                logger.debug("No token found in request to {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            logger.debug("Extracted token for request to {}: {}", request.getRequestURI(),
                token.substring(0, Math.min(token.length(), 20)) + "...");

            String email = jwtUtil.extractEmail(token);
            logger.debug("Extracted email from token: {}", email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Optional<User> optionalUser = userService.findByEmail(email);

                if (optionalUser.isPresent()) {
                    boolean isValid = jwtUtil.validateToken(token, email);
                    logger.debug("Token validation result for {}: {}", email, isValid);

                    if (isValid) {
                        User user = optionalUser.get();

                        MyUserDetails userDetails = new MyUserDetails(user);

                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        logger.debug("Authentication set for user: {}", email);
                    } else {
                        logger.warn("Token validation failed for user: {}", email);
                    }
                } else {
                    logger.warn("User not found for email: {}", email);
                }
            }
        } catch (Exception ex) {
            // Ako JWT nije validan (npr. istekao, pogrešno potpisan itd.), ne prekidamo ceo request.
            // Time omogućavamo da public endpointi (poput cover slika) ostanu dostupni čak i ako korisnik
            // ima zastareo token u storage-u. Endpointi koji zahtevaju autentikaciju će i dalje vratiti 401.
            logger.warn("Invalid JWT token received for request to {}: {}", request.getRequestURI(), ex.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String token = extractFromHeader(authHeader);

        if (token != null) {
            return token;
        }

        String customHeader = request.getHeader("X-Readify-Auth");
        token = extractFromHeader(customHeader);
        if (token != null) {
            return token;
        }

        String queryToken = request.getParameter("authToken");
        return extractFromHeader(queryToken);
    }

    private String extractFromHeader(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        String trimmed = rawValue.trim();
        if (trimmed.toLowerCase().startsWith("bearer ")) {
            String withoutPrefix = trimmed.substring(7).trim();
            return withoutPrefix.isEmpty() ? null : withoutPrefix;
        }

        return trimmed;
    }
}
