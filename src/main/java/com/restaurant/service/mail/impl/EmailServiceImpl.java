package com.restaurant.service.mail.impl;

import com.restaurant.service.mail.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Override
    public void sendPasswordResetOtp(String to, String userName, String otpCode) {
        try {
            Context context = new Context();
            context.setVariable("userName", userName != null ? userName : "Khách hàng");
            context.setVariable("otpCode", otpCode);
            context.setVariable("expiryMinutes", 15);

            String htmlContent = templateEngine.process("email/password-reset", context);

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, "Restaurant Management System");
            helper.setTo(to);
            helper.setSubject("Mã OTP Đặt Lại Mật Khẩu");
            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            logger.info("Password reset OTP email sent successfully to {}", to);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            logger.error("Failed to send password reset OTP email to {}", to, e);
        }
    }
}
