package com.restaurant.controller.auth;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.auth.ChangePasswordRequest;
import com.restaurant.dto.request.auth.ForgotPasswordRequest;
import com.restaurant.dto.request.auth.LoginRequest;
import com.restaurant.dto.request.auth.ResetPasswordRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.UserResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.auth.AuthService;
import com.restaurant.service.auth.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

// @RestController @RequestMapping("/api/auth")
//
// POST   /login              → AuthResponse
// GET    /me                 → UserResponse (cần đăng nhập)
// PUT    /change-password    → void (cần đăng nhập)
// POST   /forgot-password    → void
// POST   /reset-password     → void
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    /**
     * POST /api/auth/login
     * Đăng nhập nhân viên, trả về JWT và thông tin user.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    /**
     * GET /api/auth/me
     * Lấy thông tin user đang đăng nhập.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails principal) {
        UserResponse userResponse = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    /**
     * PUT /api/auth/change-password
     * Đổi mật khẩu (cần mật khẩu hiện tại).
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    /**
     * POST /api/auth/forgot-password
     * Gửi email reset mật khẩu (nếu email tồn tại).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If the email exists, a reset link has been sent", null));
    }

    /**
     * POST /api/auth/reset-password
     * Đặt lại mật khẩu bằng token từ email.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully", null));
    }
}
