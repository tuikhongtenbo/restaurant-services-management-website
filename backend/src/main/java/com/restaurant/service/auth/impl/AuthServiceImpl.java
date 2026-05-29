package com.restaurant.service.auth.impl;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.enums.UserType;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.ChangePasswordRequest;
import com.restaurant.dto.request.auth.LoginRequest;
import com.restaurant.dto.response.auth.AuthResponse;
import com.restaurant.dto.response.auth.UserResponse;
import com.restaurant.model.Role;
import com.restaurant.model.User;
import com.restaurant.repository.UserRepository;
import com.restaurant.security.JwtTokenProvider;
import com.restaurant.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    // Số lần nhập sai mật khẩu tối đa trước khi tài khoản bị khoá tự động
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN: Đăng nhập cho nhân viên (EMPLOYEE)
    //  1. Tìm user theo email — nếu không có → báo lỗi chung (không tiết lộ email tồn tại hay không)
    //  2. Kiểm tra tài khoản có bị khoá không
    //  3. So khớp mật khẩu:
    //     - Sai → tăng failedAttempts; nếu đạt MAX_FAILED_ATTEMPTS → tự động khoá tài khoản
    //     - Đúng → reset failedAttempts về 0
    //  4. Tạo JWT access token với UserType.EMPLOYEE và trả về AuthResponse
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Bước 1: Tìm user theo email — dùng thông báo lỗi chung để tránh lộ thông tin
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        // Bước 2: Kiểm tra tài khoản có bị khoá không
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BusinessException("Account is locked. Please contact administrator");
        }

        // Kiểm tra user chưa bị xoá mềm (nhân viên nghỉ việc)
        if (user.isDeleted()) {
            throw new BusinessException("Invalid email or password");
        }

        // Bước 3: So khớp mật khẩu — BCrypt hash compare
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Tăng đếm lần nhập sai
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            // Nếu đạt ngưỡng → khoá tài khoản tự động
            if (user.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setStatus(UserStatus.LOCKED);
            }
            userRepository.save(user);
            throw new BusinessException("Invalid email or password");
        }

        // Đăng nhập thành công → reset bộ đếm lần nhập sai
        user.setFailedAttempts(0);
        userRepository.save(user);

        // Bước 4: Tạo JWT access token cho nhân viên
        String accessToken = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), UserType.EMPLOYEE);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs())
                .user(buildUserResponse(user))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy thông tin nhân viên hiện tại đang đăng nhập
    //  - userId được lấy từ JWT token đã xác thực trong SecurityContext
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        return buildUserResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE: Đổi mật khẩu cho nhân viên đang đăng nhập
    //  1. Xác minh mật khẩu hiện tại — tránh trường hợp ai đó đổi mật khẩu khi bỏ máy
    //  2. Mã hoá mật khẩu mới bằng BCrypt và lưu lại
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        // Bước 1: Lấy user và xác minh mật khẩu hiện tại
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }

        // Bước 2: Mã hoá và lưu mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map User entity → UserResponse DTO
    //  - Trích xuất tên các Role thành Set<String> để trả về cho client
    // ─────────────────────────────────────────────────────────────────────────
    private UserResponse buildUserResponse(User user) {
        // Lấy danh sách tên role (vd: "ADMIN", "WAITER") từ tập Role entities
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roles(roleNames)
                .status(user.getStatus())
                .build();
    }
}
