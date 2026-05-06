package com.restaurant.service.auth;

import com.restaurant.dto.request.auth.ChangePasswordRequest;
import com.restaurant.dto.request.auth.LoginRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.UserResponse;

import java.util.UUID;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(UUID userId);
    void changePassword(UUID userId, ChangePasswordRequest request);
}
