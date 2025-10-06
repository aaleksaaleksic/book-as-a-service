package me.remontada.readify.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import me.remontada.readify.model.Book;

import java.math.BigDecimal;

/**
 * BookUpdateDTO - DTO za update postojeće knjige
 *
 * Sva polja su opciona - updateuju se samo ona koja su poslata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookUpdateDTO {

    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @Size(min = 2, max = 255, message = "Author name must be between 2 and 255 characters")
    private String author;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    @Pattern(
            regexp = "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$",
            message = "Invalid ISBN format"
    )
    private String isbn;

    private Long categoryId;

    @Min(value = 1, message = "Book must have at least 1 page")
    @Max(value = 10000, message = "Number of pages cannot exceed 10,000")
    private Integer pages;

    @Size(min = 2, max = 50, message = "Language must be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Language must contain only letters")
    private String language;

    @Min(value = 1000, message = "Publication year cannot be before 1000")
    @Max(value = 2100, message = "Publication year cannot be after 2100")
    private Integer publicationYear;

    private Long publisherId;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @DecimalMax(value = "999999.99", message = "Price cannot exceed 999,999.99 RSD")
    @Digits(integer = 6, fraction = 2, message = "Price must have max 6 integer digits and 2 decimal places")
    private BigDecimal price;

    private Boolean isPremium;
    private Boolean isAvailable;

    public void applyToBook(Book book) {
        if (this.title != null && !this.title.trim().isEmpty()) {
            book.setTitle(this.title.trim());
        }
        if (this.author != null && !this.author.trim().isEmpty()) {
            book.setAuthor(this.author.trim());
        }
        if (this.description != null) {
            book.setDescription(this.description.trim());
        }
        if (this.isbn != null && !this.isbn.trim().isEmpty()) {
            book.setIsbn(this.isbn.replaceAll("[\\s-]", ""));
        }
        // Category and Publisher updates will be handled by service layer with categoryId and publisherId
        if (this.pages != null) {
            book.setPages(this.pages);
        }
        if (this.language != null && !this.language.trim().isEmpty()) {
            book.setLanguage(this.language.trim());
        }
        if (this.publicationYear != null) {
            book.setPublicationYear(this.publicationYear);
        }
        if (this.price != null) {
            book.setPrice(this.price);
        }
        if (this.isPremium != null) {
            book.setIsPremium(this.isPremium);
        }
        if (this.isAvailable != null) {
            book.setIsAvailable(this.isAvailable);
        }
    }
}