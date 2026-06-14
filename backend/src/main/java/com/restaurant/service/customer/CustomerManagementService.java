package com.restaurant.service.customer;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.dto.request.customer.CustomerCreateRequest;
import com.restaurant.dto.request.customer.CustomerUpdateRequest;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.dto.response.customer.CustomerLookupResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CustomerManagementService {
    Page<CustomerResponse> getAllCustomers(Pageable pageable);
    CustomerResponse getCustomerById(UUID id);
    List<CustomerResponse> searchByPhone(String phone);
    CustomerResponse createCustomer(CustomerCreateRequest request);
    CustomerResponse updateCustomer(UUID id, CustomerUpdateRequest request);
    void updateCustomerStatus(UUID id, UserStatus status);
    void deleteCustomer(UUID id);
    CustomerLookupResponse lookupCustomer(String phone);
}
