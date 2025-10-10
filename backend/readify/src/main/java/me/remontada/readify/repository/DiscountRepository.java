package me.remontada.readify.repository;

import me.remontada.readify.model.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, Long> {

    Optional<Discount> findByCode(String code);

    Optional<Discount> findByCodeAndEmail(String code, String email);

    List<Discount> findByEmail(String email);

    @Query("SELECT d FROM Discount d WHERE d.expiresAt < :now AND d.isUsed = false")
    List<Discount> findExpiredUnusedDiscounts(LocalDateTime now);

    @Query("SELECT COUNT(d) FROM Discount d WHERE d.email = :email AND d.isUsed = false AND d.expiresAt > :now")
    long countActiveDiscountsByEmail(String email, LocalDateTime now);

    boolean existsByCode(String code);
}
