package com.restaurant.controller.admin;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.response.auth.RoleResponse;
import com.restaurant.service.auth.RoleManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// @RestController @RequestMapping("/api/admin/roles")
// @PreAuthorize ADMIN hoặc MANAGER
//
// GET    /    → List<RoleResponse>
@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@RequiredArgsConstructor
public class RoleController {

    private final RoleManagementService roleManagementService;

    /**
     * GET /api/admin/roles
     * Lấy danh sách tất cả vai trò (role).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> roles = roleManagementService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }
}
