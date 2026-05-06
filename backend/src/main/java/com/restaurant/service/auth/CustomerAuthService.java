package com.restaurant.service.auth;

import com.restaurant.dto.request.auth.CustomerLoginRequest;
import com.restaurant.dto.request.auth.CustomerRegisterRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.CustomerResponse;

import java.util.UUID;

public interface CustomerAuthService {
    AuthResponse register(CustomerRegisterRequest request);
    AuthResponse login(CustomerLoginRequest request);
    CustomerResponse getCurrentCustomer(UUID customerId);
}
