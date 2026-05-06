package com.restaurant.service.auth.impl;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.enums.UserType;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.CustomerLoginRequest;
import com.restaurant.dto.request.auth.CustomerRegisterRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.model.Customer;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.security.JwtTokenProvider;
import com.restaurant.service.auth.CustomerAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerAuthServiceImpl implements CustomerAuthService {

    private final CustomerRepository customerRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AuthResponse register(CustomerRegisterRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already registered");
        }
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Phone number is already registered");
        }

        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        customerRepository.save(customer);

        String accessToken = jwtTokenProvider.generateToken(
                customer.getId(), customer.getEmail(), UserType.CUSTOMER);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(buildCustomerResponse(customer))
                .build();
    }

    @Override
    public AuthResponse login(CustomerLoginRequest request) {
        Optional<Customer> customerOptional =
                customerRepository.findByEmail(request.getLoginId());

        if (customerOptional.isEmpty()) {
            customerOptional = customerRepository.findByPhone(request.getLoginId());
        }

        Customer customer = customerOptional
                .orElseThrow(() -> new BusinessException("Invalid credentials"));

        if (customer.getStatus() == UserStatus.LOCKED) {
            throw new BusinessException("Account is locked. Please contact support");
        }

        if (!passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            throw new BusinessException("Invalid credentials");
        }

        String accessToken = jwtTokenProvider.generateToken(
                customer.getId(), customer.getEmail(), UserType.CUSTOMER);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(buildCustomerResponse(customer))
                .build();
    }

    @Override
    public CustomerResponse getCurrentCustomer(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("Customer not found"));
        return buildCustomerResponse(customer);
    }

    private CustomerResponse buildCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .status(customer.getStatus())
                .tier(customer.getTier())
                .totalSpent(customer.getTotalSpent())
                .currentPoints(customer.getCurrentPoints())
                .build();
    }
}
