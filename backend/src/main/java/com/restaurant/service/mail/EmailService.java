package com.restaurant.service.mail;

public interface EmailService {
    void sendPasswordResetOtp(String to, String userName, String otpCode);
}
