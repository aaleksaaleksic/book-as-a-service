package me.remontada.readify.repository;

import me.remontada.readify.model.VerificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationAttemptRepository extends JpaRepository<VerificationAttempt, Long> {

    Optional<VerificationAttempt> findByEmail(String email);

    void deleteByEmail(String email);
}
