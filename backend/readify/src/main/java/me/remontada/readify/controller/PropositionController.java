package me.remontada.readify.controller;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Proposition;
import me.remontada.readify.repository.PropositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/propositions")
public class PropositionController {

    private final PropositionRepository propositionRepository;

    @Autowired
    public PropositionController(PropositionRepository propositionRepository) {
        this.propositionRepository = propositionRepository;
    }

    /**
     * Public endpoint - Submit a book proposition (no authentication required)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitProposition(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");

            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Poruka ne može biti prazna"
                ));
            }

            if (message.length() > 1000) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "Poruka je predugačka (maksimum 1000 karaktera)"
                ));
            }

            Proposition proposition = Proposition.builder()
                    .message(message.trim())
                    .build();

            propositionRepository.save(proposition);

            log.info("New book proposition submitted: {}", message.substring(0, Math.min(50, message.length())));

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Uspešno poslat predlog"
            ));

        } catch (Exception e) {
            log.error("Error submitting proposition", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Greška pri slanju predloga"
            ));
        }
    }

    /**
     * Admin endpoint - Get all propositions
     */
    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS') or hasAuthority('CAN_UPDATE_BOOKS') or hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> getAllPropositions() {
        try {
            List<Proposition> propositions = propositionRepository.findAllByOrderByCreatedAtDesc();

            List<Map<String, Object>> propositionDTOs = propositions.stream()
                    .map(p -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", p.getId());
                        dto.put("message", p.getMessage());
                        dto.put("createdAt", p.getCreatedAt().toString());
                        return dto;
                    })
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "propositions", propositionDTOs,
                    "count", propositionDTOs.size()
            ));

        } catch (Exception e) {
            log.error("Error fetching propositions", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Greška pri učitavanju predloga"
            ));
        }
    }

    /**
     * Admin endpoint - Delete a proposition
     */
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> deleteProposition(@PathVariable Long id) {
        try {
            if (!propositionRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Predlog nije pronađen"
                ));
            }

            propositionRepository.deleteById(id);

            log.info("Deleted proposition with ID: {}", id);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Predlog je obrisan"
            ));

        } catch (Exception e) {
            log.error("Error deleting proposition", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Greška pri brisanju predloga"
            ));
        }
    }
}
