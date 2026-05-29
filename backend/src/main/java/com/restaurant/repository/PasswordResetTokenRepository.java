package com.restaurant.repository;

import com.restaurant.model.Customer;
import com.restaurant.model.PasswordResetToken;
import com.restaurant.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUserAndUsedAtIsNull(User user);
    Optional<PasswordResetToken> findByCustomerAndUsedAtIsNull(Customer customer);
}
