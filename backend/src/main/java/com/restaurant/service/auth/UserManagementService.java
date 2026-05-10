package com.restaurant.service.auth;

import com.restaurant.dto.request.auth.RegisterRequest;
import com.restaurant.dto.response.auth.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserManagementService {
    Page<UserResponse> getUsers(String role, String status, Pageable pageable);
    UserResponse getUserById(UUID id);
    UserResponse createUser(RegisterRequest request, UUID createdBy);
    UserResponse updateUser(UUID id, RegisterRequest request);
    void lockUser(UUID id);
    void unlockUser(UUID id);
    void resetUserPassword(UUID id);
}
