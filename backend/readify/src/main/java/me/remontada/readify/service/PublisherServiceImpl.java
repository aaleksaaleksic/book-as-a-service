package me.remontada.readify.service;

import lombok.extern.slf4j.Slf4j;
import me.remontada.readify.model.Publisher;
import me.remontada.readify.repository.PublisherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class PublisherServiceImpl implements PublisherService {

    private final PublisherRepository publisherRepository;

    @Autowired
    public PublisherServiceImpl(PublisherRepository publisherRepository) {
        this.publisherRepository = publisherRepository;
    }

    @Override
    public List<Publisher> getAllPublishers() {
        return publisherRepository.findAll();
    }

    @Override
    public Optional<Publisher> getPublisherById(Long id) {
        return publisherRepository.findById(id);
    }

    @Override
    @Transactional
    public Publisher createPublisher(String name, String description, String website) {
        if (publisherRepository.existsByName(name)) {
            throw new IllegalArgumentException("Publisher with this name already exists");
        }

        Publisher publisher = Publisher.builder()
                .name(name)
                .description(description)
                .website(website)
                .build();

        Publisher saved = publisherRepository.save(publisher);
        log.info("Created publisher: {} (ID: {})", saved.getName(), saved.getId());
        return saved;
    }

    @Override
    @Transactional
    public Publisher updatePublisher(Long id, String name, String description, String website) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publisher not found"));

        // Check if name is being changed and if new name already exists
        if (!publisher.getName().equals(name) && publisherRepository.existsByName(name)) {
            throw new IllegalArgumentException("Publisher with this name already exists");
        }

        publisher.setName(name);
        publisher.setDescription(description);
        publisher.setWebsite(website);

        Publisher updated = publisherRepository.save(publisher);
        log.info("Updated publisher ID: {}", id);
        return updated;
    }

    @Override
    @Transactional
    public void deletePublisher(Long id) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Publisher not found"));

        publisherRepository.delete(publisher);
        log.info("Deleted publisher ID: {}", id);
    }

    @Override
    public boolean existsByName(String name) {
        return publisherRepository.existsByName(name);
    }
}
