package com.restaurant.dto.response.auth;

import com.restaurant.common.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String employeeId;
    private String fullName;
    private String email;
    private String phone;
    private java.util.Set<String> roles;
    private UserStatus status;
}
