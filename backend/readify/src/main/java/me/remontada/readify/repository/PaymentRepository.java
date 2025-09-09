package me.remontada.readify.repository;

import me.remontada.readify.model.Payment;
import me.remontada.readify.model.PaymentStatus;
import me.remontada.readify.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserOrderByCreatedAtDesc(User user);

    List<Payment> findBySubscriptionIdOrderByCreatedAtDesc(Long subscriptionId);

    @Query("SELECT COALESCE(SUM(p.amountInRsd), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt BETWEEN :start AND :end")
    BigDecimal getTotalRevenueForPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p.status, COUNT(p) FROM Payment p GROUP BY p.status")
    List<Object[]> getPaymentCountByStatus();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED'")
    long countSuccessfulPayments();

    @Query("SELECT p FROM Payment p WHERE p.subscription.id = :subscriptionId ORDER BY p.createdAt DESC")
    List<Payment> findLatestPaymentForSubscription(@Param("subscriptionId") Long subscriptionId);
}