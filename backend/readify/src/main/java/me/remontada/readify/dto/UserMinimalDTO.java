package me.remontada.readify.dto.response;

import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class UserMinimalDTO {

    private Long id;

    private String fullName;

    private String email;

    private Boolean active;


    public boolean isValid() {
        return id != null && fullName != null && !fullName.trim().isEmpty();
    }
}