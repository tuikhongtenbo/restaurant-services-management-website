package com.restaurant.service.auth;

import com.restaurant.dto.request.auth.CustomerLoginRequest;
import com.restaurant.dto.request.auth.CustomerRegisterRequest;
import com.restaurant.dto.request.auth.ChangePasswordRequest;
import com.restaurant.dto.request.auth.UpdateCustomerRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.dto.response.auth.CustomerVoucherResponse;

import java.util.List;
import java.util.UUID;

public interface CustomerAuthService {
    AuthResponse register(CustomerRegisterRequest request);
    AuthResponse login(CustomerLoginRequest request);
    CustomerResponse getCurrentCustomer(UUID customerId);
    void changePassword(UUID customerId, ChangePasswordRequest request);
    CustomerResponse updateCustomerInfo(UUID customerId, UpdateCustomerRequest request);

    /**
     * Lấy danh sách voucher đã được cấp phát cho khách hàng.
     */
    List<CustomerVoucherResponse> getMyVouchers(UUID customerId);
}

