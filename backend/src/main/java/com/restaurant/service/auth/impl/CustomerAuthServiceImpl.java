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

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER: Đăng ký tài khoản khách hàng mới
    //  1. Kiểm tra email chưa được đăng ký — email là định danh duy nhất
    //  2. Kiểm tra số điện thoại chưa được đăng ký
    //  3. Tạo Customer mới với mật khẩu đã mã hoá (BCrypt)
    //  4. Tạo JWT access token với UserType.CUSTOMER và trả về AuthResponse
    //     (đăng nhập luôn sau khi đăng ký — không cần bước xác nhận email)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public AuthResponse register(CustomerRegisterRequest request) {
        // Bước 1 & 2: Kiểm tra trùng email và số điện thoại
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already registered");
        }
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Phone number is already registered");
        }

        // Bước 3: Tạo Customer mới — mã hoá mật khẩu trước khi lưu
        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        customerRepository.save(customer);

        // Bước 4: Tạo JWT và trả về ngay để client đăng nhập luôn
        String accessToken = jwtTokenProvider.generateToken(
                customer.getId(), customer.getEmail(), UserType.CUSTOMER);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(buildCustomerResponse(customer))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN: Đăng nhập cho khách hàng — hỗ trợ cả email lẫn số điện thoại
    //  1. Thử tìm theo email trước (loginId có thể là email hoặc số điện thoại)
    //  2. Nếu không có → thử tìm theo số điện thoại
    //  3. Kiểm tra tài khoản có bị khoá không
    //  4. So khớp mật khẩu
    //  5. Tạo JWT access token với UserType.CUSTOMER
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public AuthResponse login(CustomerLoginRequest request) {
        // Bước 1: Thử tìm bằng email
        Optional<Customer> customerOptional =
                customerRepository.findByEmail(request.getLoginId());

        // Bươc 2: Không tìm được bằng email thì tìm bằng số điện thoại
        if (customerOptional.isEmpty()) {
            customerOptional = customerRepository.findByPhone(request.getLoginId());
        }

        // Nếu cả email lẫn phone đều không khớp thì báo lỗi chung (không tiết lộ tài khoản tồn tại hay không)
        Customer customer = customerOptional
                .orElseThrow(() -> new BusinessException("Invalid credentials"));

        // Bước 3: Kiểm tra tài khoản có bị khoá hoặc bị xoá mềm không
        if (customer.isDeleted()) {
            throw new BusinessException("Account has been deleted");
        }
        if (customer.getStatus() == UserStatus.LOCKED) {
            throw new BusinessException("Account is locked. Please contact support");
        }

        // Bước 4: So khớp mật khẩu — BCrypt hash compare
        if (!passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            throw new BusinessException("Invalid credentials");
        }

        // Bước 5: Tạo JWT access token cho khách hàng
        String accessToken = jwtTokenProvider.generateToken(
                customer.getId(), customer.getEmail(), UserType.CUSTOMER);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(buildCustomerResponse(customer))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy thông tin khách hàng hiện tại đang đăng nhập
    //  - customerId được lấy từ JWT token đã xác thực trong SecurityContext
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public CustomerResponse getCurrentCustomer(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("Customer not found"));
        return buildCustomerResponse(customer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map Customer entity → CustomerResponse DTO
    //  - Bao gồm thông tin điểm tích luỹ, hạng thành viên (tier), và tổng chi tiêu
    // ─────────────────────────────────────────────────────────────────────────
    private CustomerResponse buildCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .status(customer.getStatus())
                .tier(customer.getTier())             // Hạng thành viên: BRONZE / SILVER / GOLD
                .totalSpent(customer.getTotalSpent()) // Tổng chi tiêu tích luỹ (dùng để tính tier)
                .currentPoints(customer.getCurrentPoints()) // Điểm hiện tại có thể đổi ưu đãi
                .build();
    }
}
