package com.restaurant.service.auth;

import com.restaurant.dto.request.auth.ForgotPasswordRequest;
import com.restaurant.dto.request.auth.ResetPasswordRequest;

public interface PasswordResetService {
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
