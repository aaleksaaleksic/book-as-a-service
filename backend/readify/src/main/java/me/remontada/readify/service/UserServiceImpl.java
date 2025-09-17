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

    @Autowired
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

        user.setEmailVerificationToken(UUID.randomUUID().toString());
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        return save(user);
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
        // TODO: Implement email sending logic
        System.out.println("Sending email verification to: " + email);
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

        // Generate verification tokens
        user.setEmailVerificationToken(UUID.randomUUID().toString());
        user.setPhoneVerificationCode(generateSixDigitCode());
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        user.setPermissions(Set.of(
                Permission.CAN_READ_BOOKS,
                Permission.CAN_SUBSCRIBE,
                Permission.CAN_VIEW_SUBSCRIPTION
        ));

        return save(user);
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

    private String generateSixDigitCode() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
    }
}