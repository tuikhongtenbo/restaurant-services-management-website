package com.restaurant.service.customer.impl;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.customer.CustomerCreateRequest;
import com.restaurant.dto.request.customer.CustomerUpdateRequest;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.dto.response.customer.CustomerLookupResponse;
import com.restaurant.model.Customer;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.service.customer.CustomerManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerManagementServiceImpl implements CustomerManagementService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAllByDeletedAtIsNull(pageable)
                .map(this::buildCustomerResponse);
    }

    @Override
    public CustomerResponse getCustomerById(UUID id) {
        Customer customer = getCustomerEntityById(id);
        return buildCustomerResponse(customer);
    }

    @Override
    public List<CustomerResponse> searchByPhone(String phone) {
        return customerRepository.findByPhoneContainingAndDeletedAtIsNull(phone)
                .stream()
                .map(this::buildCustomerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Số điện thoại đã được đăng ký");
        }
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (customerRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Email đã được đăng ký");
            }
        }

        // Tạo mật khẩu mặc định (ví dụ SĐT), vì cashier chỉ tạo KH để lưu sđt chứ không cung cấp pass
        String defaultPassword = request.getPhone();

        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(defaultPassword))
                .status(UserStatus.ACTIVE)
                .build();

        customer = customerRepository.save(customer);
        return buildCustomerResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(UUID id, CustomerUpdateRequest request) {
        Customer customer = getCustomerEntityById(id);

        if (!customer.getPhone().equals(request.getPhone()) && customerRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Số điện thoại đã được đăng ký");
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (!request.getEmail().equals(customer.getEmail()) && customerRepository.existsByEmail(request.getEmail())) {
                throw new BusinessException("Email đã được đăng ký");
            }
        }

        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());

        customer = customerRepository.save(customer);
        return buildCustomerResponse(customer);
    }

    @Override
    @Transactional
    public void updateCustomerStatus(UUID id, UserStatus status) {
        Customer customer = getCustomerEntityById(id);
        customer.setStatus(status);
        customerRepository.save(customer);
    }

    @Override
    @Transactional
    public void deleteCustomer(UUID id) {
        Customer customer = getCustomerEntityById(id);
        customer.setDeletedAt(OffsetDateTime.now());
        customerRepository.save(customer);
    }

    @Override
    public CustomerLookupResponse lookupCustomer(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng với số điện thoại này"));
        
        return CustomerLookupResponse.builder()
                .maskedName(maskName(customer.getFullName()))
                .currentPoints(customer.getCurrentPoints())
                .tier(customer.getTier())
                .build();
    }

    private Customer getCustomerEntityById(UUID id) {
        return customerRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new BusinessException("Không tìm thấy khách hàng"));
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

    private String maskName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "***";
        }
        String[] parts = fullName.trim().split(" ");
        if (parts.length == 1) {
            String name = parts[0];
            if (name.length() <= 2) return name + "***";
            return name.substring(0, 1) + "***" + name.substring(name.length() - 1);
        }
        
        StringBuilder masked = new StringBuilder();
        // Giữ nguyên họ
        masked.append(parts[0]).append(" ");
        // Các chữ lót thay bằng ***
        for (int i = 1; i < parts.length - 1; i++) {
            masked.append("*** ");
        }
        // Chữ cuối: hiển thị chữ cái đầu, các chữ sau thay bằng *
        String lastName = parts[parts.length - 1];
        if (lastName.length() > 1) {
            masked.append(lastName.substring(0, 1)).append("***");
        } else {
            masked.append(lastName).append("***");
        }
        
        return masked.toString();
    }
}
