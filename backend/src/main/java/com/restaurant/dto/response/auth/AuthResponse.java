package com.restaurant.dto.response.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType; // "Bearer"
    private Long expiresIn;
    private Object user; // UserResponse or CustomerResponse

    /**
     * Voucher chào mừng được cấp ngay sau khi đăng ký thành công.
     * Chỉ có giá trị khác null khi đây là response từ API đăng ký (register).
     * Với login response, trường này sẽ là null.
     */
    private CustomerVoucherResponse welcomeVoucher;
}
