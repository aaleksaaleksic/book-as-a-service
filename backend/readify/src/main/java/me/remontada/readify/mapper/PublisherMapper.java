package me.remontada.readify.mapper;

import me.remontada.readify.dto.response.PublisherResponseDTO;
import me.remontada.readify.model.Publisher;

import java.util.List;
import java.util.stream.Collectors;

public class PublisherMapper {

    public static PublisherResponseDTO toResponseDTO(Publisher publisher) {
        if (publisher == null) {
            return null;
        }

        return PublisherResponseDTO.builder()
                .id(publisher.getId())
                .name(publisher.getName())
                .description(publisher.getDescription())
                .website(publisher.getWebsite())
                .createdAt(publisher.getCreatedAt())
                .updatedAt(publisher.getUpdatedAt())
                .build();
    }

    public static List<PublisherResponseDTO> toResponseDTOList(List<Publisher> publishers) {
        return publishers.stream()
                .map(PublisherMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}
