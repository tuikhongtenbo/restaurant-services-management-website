package com.restaurant.controller.auth;

import com.restaurant.common.enums.UserType;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.auth.CustomerLoginRequest;
import com.restaurant.dto.request.auth.CustomerRegisterRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.auth.CustomerAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/customer")
@RequiredArgsConstructor
public class CustomerAuthController {

    private final CustomerAuthService customerAuthService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody CustomerRegisterRequest request) {
        AuthResponse authResponse = customerAuthService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody CustomerLoginRequest request) {
        AuthResponse authResponse = customerAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer(
            @AuthenticationPrincipal CustomUserDetails principal) {
        CustomerResponse customerResponse = customerAuthService.getCurrentCustomer(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(customerResponse));
    }
}
