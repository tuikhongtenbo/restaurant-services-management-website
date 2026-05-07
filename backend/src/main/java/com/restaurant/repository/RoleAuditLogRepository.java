package com.restaurant.repository;

import com.restaurant.model.RoleAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoleAuditLogRepository extends JpaRepository<RoleAuditLog, UUID> {
}
