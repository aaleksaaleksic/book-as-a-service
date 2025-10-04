package me.remontada.readify.service;

import me.remontada.readify.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {

    Optional<User> findByEmail(String email);

    List<User> findAll();

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
}