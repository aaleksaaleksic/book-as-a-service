package me.remontada.readify.controller;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.dto.request.CategoryCreateDTO;
import me.remontada.readify.dto.response.CategoryResponseDTO;
import me.remontada.readify.mapper.CategoryMapper;
import me.remontada.readify.model.Category;
import me.remontada.readify.service.CategoryService;
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
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategories() {
        try {
            List<Category> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(CategoryMapper.toResponseDTOList(categories));
        } catch (Exception e) {
            log.error("Error fetching categories", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(@PathVariable Long id) {
        try {
            Category category = categoryService.getCategoryById(id)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            return ResponseEntity.ok(CategoryMapper.toResponseDTO(category));
        } catch (Exception e) {
            log.error("Error fetching category: {}", id, e);
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CAN_CREATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> createCategory(
            @Valid @RequestBody CategoryCreateDTO categoryDTO,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            categoryDTO.trimStrings();

            Category category = categoryService.createCategory(
                    categoryDTO.getName(),
                    categoryDTO.getDescription()
            );

            log.info("Admin {} created category: {} (ID: {})",
                    authentication.getName(), category.getName(), category.getId());

            response.put("success", true);
            response.put("message", "Category created successfully");
            response.put("category", CategoryMapper.toResponseDTO(category));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Validation error creating category", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            log.error("Error creating category", e);
            response.put("success", false);
            response.put("message", "Failed to create category");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_UPDATE_BOOKS')")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryCreateDTO categoryDTO,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            categoryDTO.trimStrings();

            Category category = categoryService.updateCategory(
                    id,
                    categoryDTO.getName(),
                    categoryDTO.getDescription()
            );

            log.info("Admin {} updated category ID: {}", authentication.getName(), id);

            response.put("success", true);
            response.put("message", "Category updated successfully");
            response.put("category", CategoryMapper.toResponseDTO(category));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Validation error updating category", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        } catch (Exception e) {
            log.error("Error updating category: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CAN_DELETE_BOOKS')")
    public ResponseEntity<Map<String, Object>> deleteCategory(
            @PathVariable Long id,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            categoryService.deleteCategory(id);

            log.info("Admin {} deleted category ID: {}", authentication.getName(), id);

            response.put("success", true);
            response.put("message", "Category deleted successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error deleting category: {}", id, e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(400).body(response);
        }
    }
}
