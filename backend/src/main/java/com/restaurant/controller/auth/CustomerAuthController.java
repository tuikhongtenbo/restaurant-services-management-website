package com.restaurant.controller.auth;

import com.restaurant.common.enums.UserType;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.auth.CustomerLoginRequest;
import com.restaurant.dto.request.auth.CustomerRegisterRequest;
import com.restaurant.dto.request.auth.ChangePasswordRequest;
import com.restaurant.dto.request.auth.UpdateCustomerRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.dto.response.auth.CustomerVoucherResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.auth.CustomerAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// @RestController @RequestMapping("/api/auth/customer")
//
// POST   /register    → AuthResponse
// POST   /login        → AuthResponse
// GET    /me           → CustomerResponse (cần đăng nhập)
@RestController
@RequestMapping("/api/auth/customer")
@RequiredArgsConstructor
public class CustomerAuthController {

    private final CustomerAuthService customerAuthService;

    /**
     * POST /api/auth/customer/register
     * Đăng ký tài khoản khách hàng mới.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody CustomerRegisterRequest request) {
        AuthResponse authResponse = customerAuthService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(authResponse));
    }

    /**
     * POST /api/auth/customer/login
     * Đăng nhập khách hàng, trả về JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody CustomerLoginRequest request) {
        AuthResponse authResponse = customerAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    /**
     * GET /api/auth/customer/me
     * Lấy thông tin khách hàng đang đăng nhập.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer(
            @AuthenticationPrincipal CustomUserDetails principal) {
        CustomerResponse customerResponse = customerAuthService.getCurrentCustomer(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(customerResponse));
    }

    /**
     * PUT /api/auth/customer/change-password
     * Đổi mật khẩu khách hàng.
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        customerAuthService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    /**
     * PUT /api/auth/customer/update
     * Cập nhật thông tin khách hàng.
     */
    @PutMapping("/update")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomerInfo(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse response = customerAuthService.updateCustomerInfo(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    /**
     * GET /api/auth/customer/vouchers
     * Lấy danh sách voucher đã được cấp phát cho khách hàng đang đăng nhập.
     */
    @GetMapping("/vouchers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CustomerVoucherResponse>>> getMyVouchers(
            @AuthenticationPrincipal CustomUserDetails principal) {
        List<CustomerVoucherResponse> vouchers = customerAuthService.getMyVouchers(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(vouchers));
    }
}
