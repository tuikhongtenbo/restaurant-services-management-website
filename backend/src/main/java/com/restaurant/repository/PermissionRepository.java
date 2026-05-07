package com.restaurant.repository;

import com.restaurant.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Set;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    
    @Query("SELECT DISTINCT p FROM User u JOIN u.roles r JOIN r.permissions p WHERE u.id = :userId AND p.isActive = true AND r.isActive = true")
    Set<Permission> findActivePermissionsByUserId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT r.name FROM User u JOIN u.roles r WHERE u.id = :userId AND r.isActive = true")
    Set<String> findActiveRoleNamesByUserId(@Param("userId") UUID userId);
}
