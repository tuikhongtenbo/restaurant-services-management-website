package com.restaurant.repository;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
    Page<User> findByRoles_Name(String roleName, Pageable pageable);
    Page<User> findByStatus(UserStatus status, Pageable pageable);
}
