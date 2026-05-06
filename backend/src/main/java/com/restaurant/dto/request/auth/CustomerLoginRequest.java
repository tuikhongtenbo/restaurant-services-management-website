package com.restaurant.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerLoginRequest {
    @NotBlank(message = "Phone or email is required")
    private String loginId; // phone or email

    @NotBlank(message = "Password is required")
    private String password;
}
