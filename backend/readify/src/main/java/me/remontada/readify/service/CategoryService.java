package me.remontada.readify.service;

import me.remontada.readify.model.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryService {
    List<Category> getAllCategories();
    Optional<Category> getCategoryById(Long id);
    Category createCategory(String name, String description);
    Category updateCategory(Long id, String name, String description);
    void deleteCategory(Long id);
    boolean existsByName(String name);
}
