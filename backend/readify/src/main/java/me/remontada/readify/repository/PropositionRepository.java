package me.remontada.readify.repository;

import me.remontada.readify.model.Proposition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropositionRepository extends JpaRepository<Proposition, Long> {
    List<Proposition> findAllByOrderByCreatedAtDesc();
}
