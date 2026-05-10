package com.restaurant.dto.response.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType; // "Bearer"
    private Long expiresIn;
    private Object user; // UserResponse or CustomerResponse
}
