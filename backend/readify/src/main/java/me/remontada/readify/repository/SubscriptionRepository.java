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


    @Query("SELECT s FROM Subscription s WHERE s.user = :user AND s.status = 'ACTIVE' AND s.endDate > :now")
    Optional<Subscription> findActiveSubscription(@Param("user") User user, @Param("now") LocalDateTime now);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate <= :now")
    List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE'")
    long countActiveSubscriptions();

    @Query("SELECT s.type, COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' GROUP BY s.type")
    List<Object[]> getActiveSubscriptionsByType();

    boolean existsByUser(User user);


    List<Subscription> findByStatus(SubscriptionStatus status);

    long countByStatus(SubscriptionStatus status);


    @Query("SELECT s FROM Subscription s WHERE (s.status = 'ACTIVE' OR s.status = 'CANCELED') AND s.endDate < :expiredBefore")
    List<Subscription> findActiveSubscriptionsExpiredBefore(@Param("expiredBefore") LocalDateTime expiredBefore);


    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.autoRenew = true AND s.endDate BETWEEN :now AND :renewalWindow")
    List<Subscription> findSubscriptionsNearingRenewal(@Param("now") LocalDateTime now, @Param("renewalWindow") LocalDateTime renewalWindow);


    @Query("SELECT s FROM Subscription s WHERE s.user = :user ORDER BY s.createdAt DESC")
    List<Subscription> findByUserOrderByCreatedAtDesc(@Param("user") User user);

    @Query("""
            SELECT s FROM Subscription s
            WHERE s.id IN (
                SELECT MAX(s2.id)
                FROM Subscription s2
                GROUP BY s2.user.id
            )
            ORDER BY s.createdAt DESC
            """)
    List<Subscription> findLatestSubscriptionsForAllUsers();

    /**
     * Check if user has specific subscription type in history
     * Used to prevent multiple trials
     */
    @Query("SELECT COUNT(s) > 0 FROM Subscription s WHERE s.user = :user AND s.type = :type")
    boolean existsByUserAndType(@Param("user") User user, @Param("type") me.remontada.readify.model.SubscriptionType type);

    /**
     * Get revenue analytics - total subscription revenue by period
     */
    @Query("SELECT COALESCE(SUM(s.priceInRsd), 0) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.createdAt BETWEEN :start AND :end")
    java.math.BigDecimal getTotalSubscriptionRevenueForPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Get subscription analytics - count by status for admin dashboard
     */
    @Query("SELECT s.status, COUNT(s) FROM Subscription s GROUP BY s.status")
    List<Object[]> getSubscriptionCountByStatus();

    /**
     * Get subscription analytics - count by type for admin dashboard
     */
    @Query("SELECT s.type, COUNT(s) FROM Subscription s GROUP BY s.type")
    List<Object[]> getSubscriptionCountByType();
}