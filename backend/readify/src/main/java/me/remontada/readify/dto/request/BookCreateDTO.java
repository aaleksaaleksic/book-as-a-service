package me.remontada.readify.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookCreateDTO {

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(min = 2, max = 255, message = "Author name must be between 2 and 255 characters")
    private String author;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @NotBlank(message = "ISBN is required")
    @Pattern(
            regexp = "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$",
            message = "Invalid ISBN format. Must be valid ISBN-10 or ISBN-13"
    )
    private String isbn;

    @NotBlank(message = "Category is required")
    @Size(min = 2, max = 100, message = "Category must be between 2 and 100 characters")
    private String category;

    @NotNull(message = "Number of pages is required")
    @Min(value = 1, message = "Book must have at least 1 page")
    @Max(value = 10000, message = "Number of pages cannot exceed 10,000")
    private Integer pages;

    @NotBlank(message = "Language is required")
    @Size(min = 2, max = 50, message = "Language must be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Language must contain only letters")
    private String language;

    @Min(value = 1000, message = "Publication year cannot be before 1000")
    @Max(value = 2100, message = "Publication year cannot be after 2100")
    private Integer publicationYear;

    // Publisher removed - doesn't exist in Book entity

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @DecimalMax(value = "999999.99", message = "Price cannot exceed 999,999.99 RSD")
    @Digits(integer = 6, fraction = 2, message = "Price must have max 6 integer digits and 2 decimal places")
    private BigDecimal price;

    @NotNull(message = "Premium status is required")
    private Boolean isPremium;

    @NotNull(message = "Availability status is required")
    private Boolean isAvailable;

    private String contentFilePath;
    private String coverImageUrl;

    public void trimStrings() {
        this.title = title != null ? title.trim() : null;
        this.author = author != null ? author.trim() : null;
        this.description = description != null ? description.trim() : null;
        this.isbn = isbn != null ? isbn.replaceAll("[\\s-]", "") : null;
        this.category = category != null ? category.trim() : null;
        this.language = language != null ? language.trim() : null;
        // Only trim existing fields
    }
}