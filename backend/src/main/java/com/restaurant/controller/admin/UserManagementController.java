package com.restaurant.controller.admin;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.auth.RegisterRequest;
import com.restaurant.dto.response.auth.UserResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.auth.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// @RestController @RequestMapping("/api/admin/users")
// @PreAuthorize ADMIN hoặc MANAGER
//
// GET    /                      → Page<UserResponse> (filter: role, status)
// GET    /{id}                  → UserResponse
// POST   /                      → UserResponse
// PUT    /{id}                  → UserResponse
// PUT    /{id}/lock             → void
// PUT    /{id}/unlock           → void
// PUT    /{id}/reset-password   → void
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    /**
     * GET /api/admin/users
     * Lấy danh sách user, hỗ trợ filter theo role và trạng thái.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<UserResponse> users = userManagementService.getUsers(role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * GET /api/admin/users/{id}
     * Lấy chi tiết một user theo id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable java.util.UUID id) {
        UserResponse userResponse = userManagementService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    /**
     * POST /api/admin/users
     * Tạo user mới (nhân viên).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        UserResponse userResponse = userManagementService.createUser(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(userResponse));
    }

    /**
     * PUT /api/admin/users/{id}
     * Cập nhật thông tin user.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody RegisterRequest request) {
        UserResponse userResponse = userManagementService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated", userResponse));
    }

    /**
     * PUT /api/admin/users/{id}/lock
     * Khóa tài khoản user.
     */
    @PutMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<Void>> lockUser(@PathVariable java.util.UUID id) {
        userManagementService.lockUser(id);
        return ResponseEntity.ok(ApiResponse.success("User locked", null));
    }

    /**
     * PUT /api/admin/users/{id}/unlock
     * Mở khóa tài khoản user.
     */
    @PutMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockUser(@PathVariable java.util.UUID id) {
        userManagementService.unlockUser(id);
        return ResponseEntity.ok(ApiResponse.success("User unlocked", null));
    }

    /**
     * PUT /api/admin/users/{id}/reset-password
     * Reset mật khẩu user về mặc định / gửi mật khẩu mới.
     */
    @PutMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable java.util.UUID id) {
        userManagementService.resetUserPassword(id);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset", null));
    }
}
