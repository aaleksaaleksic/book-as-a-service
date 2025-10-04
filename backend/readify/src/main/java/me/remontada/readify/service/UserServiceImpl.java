package me.remontada.readify.service;

import me.remontada.readify.model.User;
import me.remontada.readify.model.Permission;
import me.remontada.readify.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User createUser(String firstName, String lastName, String email, String password) {
        if (existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        user.setPermissions(Set.of(
                Permission.CAN_READ_BOOKS,
                Permission.CAN_SUBSCRIBE,
                Permission.CAN_VIEW_SUBSCRIPTION
        ));

        // Generate 6-digit verification code for email
        String verificationCode = generateSixDigitCode();
        user.setEmailVerificationToken(verificationCode);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        User savedUser = save(user);

        // Send verification email
        try {
            emailService.sendVerificationEmail(email, verificationCode, user.getFullName());
        } catch (Exception e) {
            // Log error but don't fail user creation
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        return savedUser;
    }

    @Override
    public User verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByEmailVerificationToken(token);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid verification token");
        }

        User user = userOpt.get();

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token has expired");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        //user.setVerificationTokenExpiry(null);

        return save(user);
    }

    @Override
    public void sendEmailVerification(String email) {
        Optional<User> userOpt = findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with email: " + email);
        }

        User user = userOpt.get();

        // Generate new verification code
        String verificationCode = generateSixDigitCode();
        user.setEmailVerificationToken(verificationCode);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        save(user);

        // Send verification email
        emailService.sendVerificationEmail(email, verificationCode, user.getFullName());
    }

    @Override
    public User createUser(String firstName, String lastName, String email, String phoneNumber, String password) {
        if (existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }

        if (existsByPhoneNumber(phoneNumber)) {
            throw new RuntimeException("User with phone number " + phoneNumber + " already exists");
        }

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setPassword(passwordEncoder.encode(password));

        // Generate verification codes
        String emailVerificationCode = generateSixDigitCode();
        String phoneVerificationCode = generateSixDigitCode();

        user.setEmailVerificationToken(emailVerificationCode);
        user.setPhoneVerificationCode(phoneVerificationCode);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        user.setPermissions(Set.of(
                Permission.CAN_READ_BOOKS,
                Permission.CAN_SUBSCRIBE,
                Permission.CAN_VIEW_SUBSCRIPTION
        ));

        User savedUser = save(user);

        // Send verification email
        try {
            emailService.sendVerificationEmail(email, emailVerificationCode, user.getFullName());
        } catch (Exception e) {
            // Log error but don't fail user creation
            System.err.println("Failed to send verification email: " + e.getMessage());
        }

        return savedUser;
    }

    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber).isPresent();
    }

    @Override
    public User verifyPhone(String phoneNumber, String verificationCode) {
        String trimmedPhone = Optional.ofNullable(phoneNumber)
                .map(String::trim)
                .orElse("");

        String sanitizedPhone = trimmedPhone.replaceAll("\\s+", "");

        Optional<User> userOpt = Optional.empty();

        if (!trimmedPhone.isEmpty()) {
            userOpt = userRepository.findByPhoneNumber(trimmedPhone);
        }

        if (userOpt.isEmpty() && !sanitizedPhone.isEmpty()) {
            userOpt = userRepository.findByPhoneNumber(sanitizedPhone);
        }

        if (userOpt.isEmpty() && !sanitizedPhone.isEmpty()) {
            userOpt = userRepository.findByPhoneNumberSanitized(sanitizedPhone);
        }


        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();

        if (!verificationCode.equals(user.getPhoneVerificationCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        if (user.getVerificationTokenExpiry() != null &&
                user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired");
        }

        user.setPhoneVerified(true);
        user.setPhoneVerificationCode(null);
        user.setVerificationTokenExpiry(null);

        return save(user);
    }

    @Override
    public void sendPhoneVerification(String phoneNumber) {
        // TODO: Implement SMS sending logic (Twilio)
        System.out.println("Sending SMS verification to: " + phoneNumber);
    }

    @Override
    public String generatePasswordResetToken(String email) {
        Optional<User> userOpt = findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found with email: " + email);
        }

        User user = userOpt.get();

        // Generate secure random token
        String resetToken = UUID.randomUUID().toString();

        // Set token and expiry (1 hour from now)
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));

        save(user);

        // Send password reset email
        try {
            emailService.sendPasswordResetEmail(email, resetToken, user.getFullName());
        } catch (Exception e) {
            // Log error but don't fail token generation
            System.err.println("Failed to send password reset email: " + e.getMessage());
        }

        return resetToken;
    }

    @Override
    public Optional<User> findByPasswordResetToken(String token) {
        return userRepository.findByPasswordResetToken(token);
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        Optional<User> userOpt = findByPasswordResetToken(token);

        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid password reset token");
        }

        User user = userOpt.get();

        // Check if token has expired
        if (user.getPasswordResetTokenExpiry() == null ||
            user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Password reset token has expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));

        // Clear reset token
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);

        save(user);
    }

    private String generateSixDigitCode() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }
}