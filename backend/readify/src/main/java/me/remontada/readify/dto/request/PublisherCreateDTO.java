package me.remontada.readify.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublisherCreateDTO {

    @NotBlank(message = "Publisher name is required")
    @Size(max = 255, message = "Publisher name must not exceed 255 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 255, message = "Website must not exceed 255 characters")
    private String website;

    public void trimStrings() {
        if (name != null) {
            name = name.trim();
        }
        if (description != null) {
            description = description.trim();
        }
        if (website != null) {
            website = website.trim();
        }
    }
}
