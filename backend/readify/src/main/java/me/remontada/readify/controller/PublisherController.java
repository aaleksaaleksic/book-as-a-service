package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.PublisherCreateDTO;
import me.remontada.readify.dto.response.PublisherResponseDTO;
import me.remontada.readify.mapper.PublisherMapper;
import me.remontada.readify.model.Publisher;
import me.remontada.readify.service.PublisherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/publishers")
public class PublisherController {

    private final PublisherService publisherService;

    @Autowired
    public PublisherController(PublisherService publisherService) {
        this.publisherService = publisherService;
    }

    @GetMapping
    public ResponseEntity<List<PublisherResponseDTO>> getAllPublishers() {
        try {
            List<Publisher> publishers = publisherService.getAllPublishers();
            return ResponseEntity.ok(PublisherMapper.toResponseDTOList(publishers));
        } catch (Exception e) {
            log.error("Error fetching publishers", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublisherResponseDTO> getPublisherById(@PathVariable Long id) {
        try {
            Publisher publisher = publisherService.getPublisherById(id)
                    .orElseThrow(() -> new RuntimeException("Publisher not found"));
            return ResponseEntity.ok(PublisherMapper.toResponseDTO(publisher));
        } catch (Exception e) {
            log.error("Error fetching publisher: {}", id, e);
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> createPublisher(
            @Valid @RequestBody PublisherCreateDTO publisherDTO,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            publisherDTO.trimStrings();

            Publisher publisher = publisherService.createPublisher(
                    publisherDTO.getName(),
                    publisherDTO.getDescription(),
                    publisherDTO.getWebsite()
            );

            log.info("Admin {} created publisher: {} (ID: {})",
                    authentication.getName(), publisher.getName(), publisher.getId());

            response.put("success", true);
            response.put("message", "Publisher created successfully");
            response.put("publisher", PublisherMapper.toResponseDTO(publisher));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Validation error creating publisher", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            log.error("Error creating publisher", e);
            response.put("success", false);
            response.put("message", "Failed to create publisher");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_UPDATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> updatePublisher(
            @PathVariable Long id,
            @Valid @RequestBody PublisherCreateDTO publisherDTO,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            publisherDTO.trimStrings();

            Publisher publisher = publisherService.updatePublisher(
                    id,
                    publisherDTO.getName(),
                    publisherDTO.getDescription(),
                    publisherDTO.getWebsite()
            );

            log.info("Admin {} updated publisher ID: {}", authentication.getName(), id);

            response.put("success", true);
            response.put("message", "Publisher updated successfully");
            response.put("publisher", PublisherMapper.toResponseDTO(publisher));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Validation error updating publisher", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            log.error("Error updating publisher: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> deletePublisher(
            @PathVariable Long id,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            publisherService.deletePublisher(id);

            log.info("Admin {} deleted publisher ID: {}", authentication.getName(), id);

            response.put("success", true);
            response.put("message", "Publisher deleted successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error deleting publisher: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }
}
