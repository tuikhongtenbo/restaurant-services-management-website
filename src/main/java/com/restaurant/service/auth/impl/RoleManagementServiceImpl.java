package com.restaurant.service.auth.impl;

import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.model.Permission;
import com.restaurant.model.Role;
import com.restaurant.model.RoleAuditLog;
import com.restaurant.model.User;
import com.restaurant.repository.PermissionRepository;
import com.restaurant.repository.RoleAuditLogRepository;
import com.restaurant.repository.RoleRepository;
import com.restaurant.repository.UserRepository;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.auth.RoleManagementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleManagementServiceImpl implements RoleManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RoleAuditLogRepository auditLogRepository;

    @Override
    @Transactional
    @CacheEvict(value = "userPermissions", key = "#userId")
    public void grantRole(UUID userId, UUID roleId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found"));

        if (!user.getRoles().contains(role)) {
            user.getRoles().add(role);
            userRepository.save(user);
            logAudit(user, role, "GRANT", reason);
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "userPermissions", key = "#userId")
    public void revokeRole(UUID userId, UUID roleId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found"));

        if (user.getRoles().contains(role)) {
            user.getRoles().remove(role);
            userRepository.save(user);
            logAudit(user, role, "REVOKE", reason);
        }
    }

    @Override
    @Cacheable(value = "userPermissions", key = "#userId")
    public Set<String> getUserAuthorities(UUID userId) {
        Set<String> authorities = new HashSet<>();
        
        // Add roles (ROLE_ADMIN, etc.)
        Set<String> roleNames = permissionRepository.findActiveRoleNamesByUserId(userId);
        roleNames.forEach(name -> authorities.add("ROLE_" + name));
        
        // Add permissions (user:create, etc.)
        Set<Permission> permissions = permissionRepository.findActivePermissionsByUserId(userId);
        permissions.forEach(p -> authorities.add(p.getCode()));
        
        return authorities;
    }

    @Override
    public java.util.List<com.restaurant.dto.response.auth.RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(role -> com.restaurant.dto.response.auth.RoleResponse.builder()
                        .id(role.getId())
                        .name(role.getName())
                        .description(role.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    private void logAudit(User targetUser, Role role, String action, String reason) {
        UUID performedById = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            performedById = userDetails.getId();
        }

        User performedBy = performedById != null ? userRepository.findById(performedById).orElse(null) : null;
        
        String ipAddress = null;
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty()) {
                ipAddress = request.getRemoteAddr();
            }
        }

        RoleAuditLog log = RoleAuditLog.builder()
                .user(targetUser)
                .role(role)
                .action(action)
                .performedBy(performedBy)
                .reason(reason)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }
}
