package me.remontada.readify.service;

import me.remontada.readify.model.*;
import me.remontada.readify.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * PaymentServiceImpl - Implementation of payment processing for Serbian market
 *
 * Features:
 * - Mock payment processing with configurable success rate
 * - Serbian Dinar (RSD) currency support
 * - Integration with Serbian banks (NLB Pay, Intesa, Erste)
 * - Analytics and revenue tracking
 * - Payment simulation for testing
 */
@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final Random random = new Random();

    // Mock payment configuration from application.properties
    @Value("${readify.payment.mock.enabled:true}")
    private boolean mockPaymentEnabled;

    @Value("${readify.payment.mock.success-rate:95}")
    private int mockSuccessRate;

    @Value("${readify.payment.currency:RSD}")
    private String defaultCurrency;

    @Autowired
    public PaymentServiceImpl(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /**
     * Process mock payment - simulates Serbian bank payment gateway
     * Success rate is configurable through application.properties
     */
    @Override
    public Payment processMockPayment(User user, Subscription subscription, BigDecimal amount) {
        logger.info("Processing mock payment for user: {} amount: {} RSD", user.getEmail(), amount);

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setSubscription(subscription);
        payment.setAmountInRsd(amount);
        payment.setProvider(PaymentProvider.NLB_PAY); // Default Serbian bank
        payment.setCreatedAt(LocalDateTime.now());

        // Simulate payment processing with configurable success rate
        boolean paymentSuccessful = isPaymentSuccessful();

        if (paymentSuccessful) {
            // Successful payment
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            payment.setExternalTransactionId(generateTransactionId());
            payment.setBankResponseCode("00"); // Standard success code for Serbian banks
            payment.setBankResponseMessage("Transakcija uspešno završena");

            logger.info("Payment successful for user: {} transaction: {}",
                    user.getEmail(), payment.getExternalTransactionId());
        } else {
            // Failed payment
            payment.setStatus(PaymentStatus.FAILED);
            payment.setBankResponseCode("05"); // Insufficient funds or general error
            payment.setBankResponseMessage("Transakcija neuspešna - nedovoljno sredstava");

            logger.warn("Payment failed for user: {} reason: insufficient funds", user.getEmail());
        }

        return paymentRepository.save(payment);
    }

    /**
     * Get payment history for specific user ordered by newest first
     */
    @Override
    public List<Payment> getUserPayments(User user) {
        logger.debug("Fetching payment history for user: {}", user.getEmail());
        return paymentRepository.findByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Get all payments for specific subscription
     */
    @Override
    public List<Payment> getSubscriptionPayments(Long subscriptionId) {
        logger.debug("Fetching payments for subscription: {}", subscriptionId);
        return paymentRepository.findBySubscriptionIdOrderByCreatedAtDesc(subscriptionId);
    }

    /**
     * Calculate total revenue from all successful payments
     * Used for admin analytics and financial reporting
     */
    @Override
    public BigDecimal getTotalRevenue() {
        LocalDateTime startOfTime = LocalDateTime.of(2020, 1, 1, 0, 0);
        LocalDateTime now = LocalDateTime.now();

        BigDecimal revenue = paymentRepository.getTotalRevenueForPeriod(startOfTime, now);
        logger.info("Total revenue calculated: {} RSD", revenue);

        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    /**
     * Calculate revenue for current month
     * Used for monthly financial reports and admin dashboard
     */
    @Override
    public BigDecimal getRevenueForCurrentMonth() {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal monthlyRevenue = paymentRepository.getTotalRevenueForPeriod(startOfMonth, endOfMonth);
        logger.info("Monthly revenue for {}: {} RSD", currentMonth, monthlyRevenue);

        return monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO;
    }

    /**
     * Count total number of successful payments
     * Used for business analytics and admin dashboard
     */
    @Override
    public long getSuccessfulPaymentsCount() {
        long count = paymentRepository.countSuccessfulPayments();
        logger.debug("Total successful payments count: {}", count);
        return count;
    }

    /**
     * Simulate successful payment - for testing purposes
     */
    @Override
    public Payment simulateSuccessfulPayment(User user, Subscription subscription,
                                             BigDecimal amount, PaymentProvider provider) {
        logger.info("Simulating successful payment for user: {} provider: {}", user.getEmail(), provider);

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setSubscription(subscription);
        payment.setAmountInRsd(amount);
        payment.setProvider(provider);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        payment.setCreatedAt(LocalDateTime.now());
        payment.setExternalTransactionId(generateTransactionId());
        payment.setBankResponseCode("00");
        payment.setBankResponseMessage("Test transakcija - uspešno");

        return paymentRepository.save(payment);
    }

    /**
     * Simulate failed payment - for testing purposes
     */
    @Override
    public Payment simulateFailedPayment(User user, Subscription subscription,
                                         BigDecimal amount, PaymentProvider provider) {
        logger.info("Simulating failed payment for user: {} provider: {}", user.getEmail(), provider);

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setSubscription(subscription);
        payment.setAmountInRsd(amount);
        payment.setProvider(provider);
        payment.setStatus(PaymentStatus.FAILED);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setExternalTransactionId(generateTransactionId());
        payment.setBankResponseCode("05");
        payment.setBankResponseMessage("Test transakcija - neuspešno");

        return paymentRepository.save(payment);
    }

    /**
     * Check if payment should be successful based on configured success rate
     * Returns true if random number is within success rate percentage
     */
    private boolean isPaymentSuccessful() {
        if (!mockPaymentEnabled) {
            // If mock is disabled, always return true (assuming real payment gateway)
            return true;
        }

        int randomValue = random.nextInt(100) + 1; // 1-100
        boolean successful = randomValue <= mockSuccessRate;

        logger.debug("Payment simulation: random={}, success_rate={}, result={}",
                randomValue, mockSuccessRate, successful);

        return successful;
    }

    /**
     * Generate unique transaction ID in format used by Serbian banks
     * Format: RDFY-YYYYMMDD-HHMMSS-XXXXX
     * RDFY = Readify prefix
     * YYYYMMDD = Current date
     * HHMMSS = Current time
     * XXXXX = Random 5-digit number
     */
    private String generateTransactionId() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = String.format("%04d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        String timePart = String.format("%02d%02d%02d", now.getHour(), now.getMinute(), now.getSecond());
        String randomPart = String.format("%05d", random.nextInt(100000));

        String transactionId = String.format("RDFY-%s-%s-%s", datePart, timePart, randomPart);
        logger.debug("Generated transaction ID: {}", transactionId);

        return transactionId;
    }
}