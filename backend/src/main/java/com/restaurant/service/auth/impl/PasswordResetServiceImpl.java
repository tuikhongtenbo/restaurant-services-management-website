package com.restaurant.service.auth.impl;

import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.auth.ForgotPasswordRequest;
import com.restaurant.dto.request.auth.ResetPasswordRequest;
import com.restaurant.model.Customer;
import com.restaurant.model.PasswordResetToken;
import com.restaurant.model.User;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.PasswordResetTokenRepository;
import com.restaurant.repository.UserRepository;
import com.restaurant.service.auth.PasswordResetService;
import com.restaurant.service.mail.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetServiceImpl.class);
    // OTP hết hạn sau 15 phút kể từ lúc tạo
    private static final int TOKEN_EXPIRY_MINUTES = 15;

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    // SecureRandom thay cho Random thông thường để tạo OTP an toàn hơn (không đoán được)
    private final SecureRandom secureRandom = new SecureRandom();

    // ─────────────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD: Xử lý yêu cầu đặt lại mật khẩu qua email
    //  1. Tìm email trong bảng User (nhân viên) trước
    //  2. Nếu không có → tìm trong bảng Customer (khách hàng)
    //  3. Tạo OTP 6 chữ số và lưu vào DB kèm thời hạn TOKEN_EXPIRY_MINUTES
    //  4. Gửi OTP qua email
    //  NOTE: Nếu email không tồn tại → chỉ ghi log, KHÔNG báo lỗi cho client
    //        (tránh lộ thông tin tài khoản nào đang tồn tại trong hệ thống)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Bước 1: Tìm trong bảng nhân viên trước
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String otp = generateAndSaveToken(user, null);
            emailService.sendPasswordResetOtp(user.getEmail(), user.getFullName(), otp);
            return;
        }

        // Bước 2: Không phải nhân viên → thử tìm trong bảng khách hàng
        Optional<Customer> customerOptional = customerRepository.findByEmail(request.getEmail());
        if (customerOptional.isPresent()) {
            Customer customer = customerOptional.get();
            String otp = generateAndSaveToken(null, customer);
            emailService.sendPasswordResetOtp(customer.getEmail(), customer.getFullName(), otp);
            return;
        }

        // Email không tồn tại trong hệ thống → ghi log nhưng không ném lỗi ra client
        logger.info("Password reset requested for non-existent email: {}", request.getEmail());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESET PASSWORD: Xác minh OTP và đặt mật khẩu mới
    //  1. Tìm PasswordResetToken theo mã OTP — không có → lỗi
    //  2. Kiểm tra OTP đã dùng rồi chưa (isUsed)
    //  3. Kiểm tra OTP còn trong thời hạn không (isExpired)
    //  4. Mã hoá mật khẩu mới và lưu vào đúng bảng (User hoặc Customer)
    //     - Nếu là User  → reset thêm failedAttempts về 0 (mở khoá tài khoản nếu bị khoá do nhập sai)
    //  5. Đánh dấu token đã dùng (usedAt = now) để không dùng lại được
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // Bước 1: Tra cứu token theo mã OTP
        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException("Invalid or expired reset token"));

        // Bước 2: Kiểm tra token đã sử dụng chưa
        if (resetToken.isUsed()) {
            throw new BusinessException("Reset token has already been used");
        }

        // Bước 3: Kiểm tra token còn hiệu lực (chưa quá TOKEN_EXPIRY_MINUTES)
        if (resetToken.isExpired()) {
            throw new BusinessException("Reset token has expired");
        }

        // Bước 4: Mã hoá mật khẩu mới và cập nhật vào đúng bảng
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());

        if (resetToken.getUser() != null) {
            // Trường hợp nhân viên: reset cả failedAttempts để mở khoá nếu cần
            User user = resetToken.getUser();
            user.setPasswordHash(encodedPassword);
            user.setFailedAttempts(0);
            userRepository.save(user);
        } else if (resetToken.getCustomer() != null) {
            // Trường hợp khách hàng
            Customer customer = resetToken.getCustomer();
            customer.setPasswordHash(encodedPassword);
            customerRepository.save(customer);
        }

        // Bước 5: Đánh dấu token đã dùng — ngăn tái sử dụng OTP cũ
        resetToken.setUsedAt(OffsetDateTime.now());
        tokenRepository.save(resetToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Tạo OTP 6 chữ số và lưu vào DB
    //  - Chỉ một trong hai tham số (user / customer) khác null tại một thời điểm
    //  - OTP nằm trong khoảng [100000, 999999] — đảm bảo đủ 6 chữ số
    //  - expiresAt được set = now + TOKEN_EXPIRY_MINUTES
    // ─────────────────────────────────────────────────────────────────────────
    private String generateAndSaveToken(User user, Customer customer) {
        // Tạo OTP 6 chữ số ngẫu nhiên bằng SecureRandom (an toàn hơn Math.random)
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otpValue = String.valueOf(otpNumber);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .customer(customer)
                .token(otpValue)
                .expiresAt(OffsetDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES))
                .build();

        tokenRepository.save(resetToken);
        return otpValue;
    }
}
