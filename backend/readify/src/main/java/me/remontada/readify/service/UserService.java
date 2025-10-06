package me.remontada.readify.service;

import me.remontada.readify.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserService {

    Optional<User> findByEmail(String email);

    List<User> findAll();

    Page<User> findAll(Pageable pageable);

    User save(User user);

    Optional<User> findById(Long id);

    void deleteById(Long id);

    boolean existsByEmail(String email);

    User createUser(String firstName, String lastName, String email, String password);

    User verifyEmail(String token);

    void sendEmailVerification(String email);

    User createUser(String firstName, String lastName, String email, String phoneNumber, String password);

    User verifyPhone(String phoneNumber, String verificationCode);

    void sendPhoneVerification(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    String generatePasswordResetToken(String email);

    Optional<User> findByPasswordResetToken(String token);

    void resetPassword(String token, String newPassword);

    User deactivateUser(Long id);

    User activateUser(Long id);

    void deleteUser(Long id);

    List<String> getAllUserEmails();

    List<String> getActiveUserEmails();
}