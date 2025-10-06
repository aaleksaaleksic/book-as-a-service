package me.remontada.readify.service;

import me.remontada.readify.model.Publisher;

import java.util.List;
import java.util.Optional;

public interface PublisherService {
    List<Publisher> getAllPublishers();
    Optional<Publisher> getPublisherById(Long id);
    Publisher createPublisher(String name, String description, String website);
    Publisher updatePublisher(Long id, String name, String description, String website);
    void deletePublisher(Long id);
    boolean existsByName(String name);
}
