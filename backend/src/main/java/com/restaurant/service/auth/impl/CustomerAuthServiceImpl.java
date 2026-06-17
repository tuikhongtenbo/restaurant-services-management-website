package com.restaurant.service.auth.impl;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.enums.UserType;
import com.restaurant.common.enums.VoucherDiscountType;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.ChangePasswordRequest;
import com.restaurant.dto.request.auth.CustomerLoginRequest;
import com.restaurant.dto.request.auth.CustomerRegisterRequest;
import com.restaurant.dto.request.auth.UpdateCustomerRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.dto.response.auth.CustomerVoucherResponse;
import com.restaurant.model.Customer;
import com.restaurant.model.CustomerVoucher;
import com.restaurant.model.Voucher;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.CustomerVoucherRepository;
import com.restaurant.repository.VoucherRepository;
import com.restaurant.security.JwtTokenProvider;
import com.restaurant.service.auth.CustomerAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerAuthServiceImpl implements CustomerAuthService {

    private final CustomerRepository customerRepository;
    private final VoucherRepository voucherRepository;
    private final CustomerVoucherRepository customerVoucherRepository;
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

        // Bước 3: Kiểm tra tuổi (>= 16 tuổi)
        LocalDate today = LocalDate.now();
        int age = Period.between(request.getDateOfBirth(), today).getYears();
        if (age < 16) {
            throw new BusinessException("Customer must be at least 16 years old to register");
        }

        // Bước 4: Tạo Customer mới — mã hoá mật khẩu trước khi lưu
        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .dateOfBirth(request.getDateOfBirth())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        customerRepository.save(customer);

        // Bước 5: Cấp phát voucher chào mừng giảm 200k cho khách hàng mới
        CustomerVoucher welcomeVoucher = assignWelcomeVoucher(customer);

        // Bước 6: Tạo JWT và trả về ngay để client đăng nhập luôn
        String accessToken = jwtTokenProvider.generateToken(
                customer.getId(), customer.getEmail(), UserType.CUSTOMER);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(buildCustomerResponse(customer))
                .welcomeVoucher(buildCustomerVoucherResponse(welcomeVoucher))
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
    // UPDATE: Cập nhật thông tin khách hàng đang đăng nhập
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public CustomerResponse updateCustomerInfo(UUID customerId, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("Customer not found"));

        if (!customer.getPhone().equals(request.getPhone())) {
            if (customerRepository.existsByPhone(request.getPhone())) {
                throw new BusinessException("Phone number is already used by another account");
            }
        }

        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customerRepository.save(customer);

        return buildCustomerResponse(customer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE: Đổi mật khẩu cho khách hàng đang đăng nhập
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void changePassword(UUID customerId, ChangePasswordRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("Customer not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), customer.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }

        customer.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        customerRepository.save(customer);
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
                .dateOfBirth(customer.getDateOfBirth())
                .build();
    }

    // WELCOME VOUCHER: Tạo voucher chào mừng và gắn với khách hàng mới
    //  - Mỗi khách hàng nhận 1 voucher FIXED giảm 200.000đ
    //  - Chỉ dùng được 1 lần (usageLimit = 1)
    //  - Hạn dùng: 30 ngày kể từ ngày đăng ký
    //  - Đơn hàng tối thiểu 200.000đ mới được áp dụng
    private CustomerVoucher assignWelcomeVoucher(Customer customer) {
        // Sinh mã code duy nhất dạng: WELCOME-XXXXXXXX
        String code = "WELCOME-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Tạo voucher mới dành riêng cho khách hàng này
        Voucher voucher = Voucher.builder()
                .code(code)
                .description("Voucher chào mừng thành viên mới - giảm 200.000đ")
                .discountType(VoucherDiscountType.FIXED)
                .discountValue(new BigDecimal("200000"))
                .minOrderValue(new BigDecimal("200000")) // Đơn tối thiểu 200k
                .validFrom(OffsetDateTime.now())
                .validUntil(OffsetDateTime.now().plusDays(30)) // Hạn dùng 30 ngày
                .usageLimit(1) // Chỉ dùng 1 lần
                .build();
        voucherRepository.save(voucher);

        // Tạo bản ghi gắn voucher với khách hàng
        CustomerVoucher customerVoucher = CustomerVoucher.builder()
                .customer(customer)
                .voucher(voucher)
                .build();
        return customerVoucherRepository.save(customerVoucher);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy danh sách voucher được cấp cho khách hàng đang đăng nhập
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<CustomerVoucherResponse> getMyVouchers(UUID customerId) {
        return customerVoucherRepository.findByCustomerId(customerId)
                .stream()
                .map(this::buildCustomerVoucherResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map CustomerVoucher entity → CustomerVoucherResponse DTO
    // ─────────────────────────────────────────────────────────────────────────
    private CustomerVoucherResponse buildCustomerVoucherResponse(CustomerVoucher cv) {
        Voucher v = cv.getVoucher();
        return CustomerVoucherResponse.builder()
                .id(cv.getId())
                .voucherId(v.getId())
                .code(v.getCode())
                .description(v.getDescription())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .minOrderValue(v.getMinOrderValue())
                .validFrom(v.getValidFrom())
                .validUntil(v.getValidUntil())
                .isUsed(cv.getIsUsed())
                .usedAt(cv.getUsedAt())
                .assignedAt(cv.getAssignedAt())
                .build();
    }
}

