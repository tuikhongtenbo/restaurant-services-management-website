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
import java.util.List;
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

    // ─────────────────────────────────────────────────────────────────────────
    // GRANT ROLE: Gán một role mới cho user
    //  1. Tìm User và Role theo id — ném lỗi nếu không tồn tại
    //  2. Kiểm tra user chưa có role đó (tránh gán trùng)
    //  3. Thêm role vào tập roles của user và lưu lại
    //  4. Ghi audit log (ai thực hiện, từ IP nào, lý do gì)
    //  @CacheEvict: Xoá cache quyền của user để lần sau lấy quyền mới nhất
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    @CacheEvict(value = "userPermissions", key = "#userId")
    public void grantRole(UUID userId, UUID roleId, String reason) {
        // Bước 1: Tìm user và role — ném lỗi nếu không tồn tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found"));

        // Bước 2 & 3: Chỉ thêm nếu user chưa có role này (Set.contains dùng equals/hashCode của Role)
        if (!user.getRoles().contains(role)) {
            user.getRoles().add(role);
            userRepository.save(user);
            // Bước 4: Ghi audit log mỗi lần thay đổi phân quyền
            logAudit(user, role, "GRANT", reason);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVOKE ROLE: Thu hồi một role khỏi user
    //  1. Tìm User và Role theo id
    //  2. Kiểm tra user đang có role đó không (tránh xóa khi không có)
    //  3. Xoá role khỏi tập roles của user và lưu lại
    //  4. Ghi audit log
    //  @CacheEvict: Xoá cache quyền để lần sau lấy lại từ DB
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    @CacheEvict(value = "userPermissions", key = "#userId")
    public void revokeRole(UUID userId, UUID roleId, String reason) {
        // Bước 1: Tìm user và role
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found"));

        // Bước 2 & 3: Chỉ xoá nếu user đang thực sự có role này
        if (user.getRoles().contains(role)) {
            user.getRoles().remove(role);
            userRepository.save(user);
            // Bước 4: Ghi audit log thu hồi quyền
            logAudit(user, role, "REVOKE", reason);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy toàn bộ quyền (authorities) của một user để Spring Security dùng
    //  - Trả về Set<String> gồm:
    //    + "ROLE_ADMIN", "ROLE_WAITER", ... (từ bảng roles)
    //    + "order:create", "user:read", ... (từ bảng permissions)
    //  @Cacheable: Kết quả được cache theo userId — tránh truy vấn DB mỗi request
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Cacheable(value = "userPermissions", key = "#userId")
    public Set<String> getUserAuthorities(UUID userId) {
        Set<String> authorities = new HashSet<>();

        // Thêm các ROLE_ prefix cho Spring Security (vd: ROLE_ADMIN)
        Set<String> roleNames = permissionRepository.findActiveRoleNamesByUserId(userId);
        roleNames.forEach(name -> authorities.add("ROLE_" + name));

        // Thêm các permission code dạng "module:action" (vd: order:create)
        Set<Permission> permissions = permissionRepository.findActivePermissionsByUserId(userId);
        permissions.forEach(p -> authorities.add(p.getCode()));

        return authorities;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy danh sách tất cả các role trong hệ thống
    //  - Dùng cho màn hình quản lý phân quyền — dropdown chọn role khi tạo/sửa user
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public List<com.restaurant.dto.response.auth.RoleResponse> getAllRoles() {
        // Map từng Role entity sang RoleResponse DTO
        return roleRepository.findAll().stream()
                .map(role -> com.restaurant.dto.response.auth.RoleResponse.builder()
                        .id(role.getId())
                        .name(role.getName())
                        .description(role.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Ghi audit log mỗi khi có thay đổi phân quyền
    //  - Lấy người thực hiện (performedBy) từ SecurityContext của request hiện tại
    //  - Lấy IP address: ưu tiên header X-Forwarded-For (khi qua proxy/load balancer),
    //    nếu không có thì dùng RemoteAddr trực tiếp
    // ─────────────────────────────────────────────────────────────────────────
    private void logAudit(User targetUser, Role role, String action, String reason) {
        // Lấy id của người đang thực hiện thao tác từ SecurityContext
        UUID performedById = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            performedById = userDetails.getId();
        }

        User performedBy = performedById != null
                ? userRepository.findById(performedById).orElse(null)
                : null;

        // Lấy IP address của người thực hiện — ưu tiên X-Forwarded-For khi qua reverse proxy
        String ipAddress = null;
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty()) {
                ipAddress = request.getRemoteAddr();
            }
        }

        // Lưu audit log: ai làm gì, với role nào, trên user nào, từ IP nào, với lý do gì
        RoleAuditLog log = RoleAuditLog.builder()
                .user(targetUser)
                .role(role)
                .action(action)       // "GRANT" hoặc "REVOKE"
                .performedBy(performedBy)
                .reason(reason)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }
}
