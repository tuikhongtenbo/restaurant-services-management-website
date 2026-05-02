package com.restaurant.service.auth;

import java.util.Set;
import java.util.UUID;

public interface RoleManagementService {
    void grantRole(UUID userId, UUID roleId, String reason);
    void revokeRole(UUID userId, UUID roleId, String reason);
    Set<String> getUserAuthorities(UUID userId);
    java.util.List<com.restaurant.dto.response.auth.RoleResponse> getAllRoles();
}
