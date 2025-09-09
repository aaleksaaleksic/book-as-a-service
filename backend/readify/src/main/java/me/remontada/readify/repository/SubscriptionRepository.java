package me.remontada.readify.repository;

import me.remontada.readify.model.Subscription;
import me.remontada.readify.model.SubscriptionStatus;
import me.remontada.readify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByUserAndStatus(User user, SubscriptionStatus status);

    List<Subscription> findByUserOrderByCreatedAtDesc(User user);

    // Check if user has active subscription
    @Query("SELECT s FROM Subscription s WHERE s.user = :user AND s.status = 'ACTIVE' AND s.endDate > :now")
    Optional<Subscription> findActiveSubscription(@Param("user") User user, @Param("now") LocalDateTime now);

    // Find subscriptions that need to be expired
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate <= :now")
    List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);

    // Admin stats - count active subscriptions
    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE'")
    long countActiveSubscriptions();

    // Admin stats - subscriptions by type
    @Query("SELECT s.type, COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' GROUP BY s.type")
    List<Object[]> getActiveSubscriptionsByType();

    // Check if user already has subscription (any status)
    boolean existsByUser(User user);
}