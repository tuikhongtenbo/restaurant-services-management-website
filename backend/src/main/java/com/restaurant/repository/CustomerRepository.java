package com.restaurant.repository;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    @Query("SELECT c FROM Customer c WHERE c.email = :email AND c.deletedAt IS NULL")
    Optional<Customer> findByEmail(@Param("email") String email);

    @Query("SELECT c FROM Customer c WHERE c.phone = :phone AND c.deletedAt IS NULL")
    Optional<Customer> findByPhone(@Param("phone") String phone);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Page<Customer> findByStatus(UserStatus status, Pageable pageable);
}
