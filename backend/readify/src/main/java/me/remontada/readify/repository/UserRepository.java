package me.remontada.readify.repository;

import me.remontada.readify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByEmailVerificationToken(String token);

    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u WHERE REPLACE(u.phoneNumber, ' ', '') = :sanitizedPhone")
    Optional<User> findByPhoneNumberSanitized(@Param("sanitizedPhone") String sanitizedPhone);

    Optional<User> findByPasswordResetToken(String token);

}
