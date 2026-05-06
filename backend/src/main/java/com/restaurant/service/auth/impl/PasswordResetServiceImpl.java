package com.restaurant.service.auth.impl;

import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.ForgotPasswordRequest;
import com.restaurant.dto.request.auth.ResetPasswordRequest;
import com.restaurant.model.Customer;
import com.restaurant.model.PasswordResetToken;
import com.restaurant.model.User;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.PasswordResetTokenRepository;
import com.restaurant.repository.UserRepository;
import com.restaurant.service.auth.PasswordResetService;
import com.restaurant.service.mail.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    private static final int TOKEN_EXPIRY_MINUTES = 15;

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String otp = generateAndSaveToken(user, null);
            emailService.sendPasswordResetOtp(user.getEmail(), user.getFullName(), otp);
            return;
        }

        Optional<Customer> customerOptional = customerRepository.findByEmail(request.getEmail());
        if (customerOptional.isPresent()) {
            Customer customer = customerOptional.get();
            String otp = generateAndSaveToken(null, customer);
            emailService.sendPasswordResetOtp(customer.getEmail(), customer.getFullName(), otp);
            return;
        }

        logger.info("Password reset requested for non-existent email: {}", request.getEmail());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException("Invalid or expired reset token"));

        if (resetToken.isUsed()) {
            throw new BusinessException("Reset token has already been used");
        }

        if (resetToken.isExpired()) {
            throw new BusinessException("Reset token has expired");
        }

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());

        if (resetToken.getUser() != null) {
            User user = resetToken.getUser();
            user.setPasswordHash(encodedPassword);
            user.setFailedAttempts(0);
            userRepository.save(user);
        } else if (resetToken.getCustomer() != null) {
            Customer customer = resetToken.getCustomer();
            customer.setPasswordHash(encodedPassword);
            customerRepository.save(customer);
        }

        resetToken.setUsedAt(OffsetDateTime.now());
        tokenRepository.save(resetToken);
    }

    private String generateAndSaveToken(User user, Customer customer) {
        // Generate a 6-digit OTP
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otpValue = String.valueOf(otpNumber);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .customer(customer)
                .token(otpValue)
                .expiresAt(OffsetDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES))
                .build();

        tokenRepository.save(resetToken);
        return otpValue;
    }
}
