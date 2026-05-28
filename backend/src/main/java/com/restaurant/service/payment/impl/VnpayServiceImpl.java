package com.restaurant.service.payment.impl;

import com.restaurant.common.utils.VnpayUtil;
import com.restaurant.config.VnpayProperties;
import com.restaurant.service.payment.VnpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VnpayServiceImpl implements VnpayService {

    private final VnpayProperties vnpayProperties;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE URL: Tạo URL redirect VNPay đã ký HMAC-SHA512
    //  1. Build params cơ bản (version, tmnCode, txnRef, expireDate...)
    //  2. Gắn vnp_Amount (×100), vnp_IpAddr, optional vnp_BankCode
    //  3. Ký hash và ghép thành paymentUrl
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public String createPaymentUrl(UUID invoiceId, BigDecimal amount, String ipAddress, String bankCode) {
        Map<String, String> params = buildBaseParams(invoiceId);
        params.put("vnp_Amount", String.valueOf(VnpayUtil.toVnpAmount(amount)));
        params.put("vnp_IpAddr", ipAddress);
        if (bankCode != null && !bankCode.isBlank()) {
            params.put("vnp_BankCode", bankCode);
        }
        return buildSignedPaymentUrl(params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFY: Xác minh chữ ký callback/IPN từ VNPay
    //  - Loại bỏ vnp_SecureHash khỏi params, sort key, HMAC-SHA512 so sánh
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }
        Map<String, String> hashParams = new HashMap<>(params);
        hashParams.remove("vnp_SecureHash");
        hashParams.remove("vnp_SecureHashType");
        String hashData = VnpayUtil.buildQueryString(hashParams, false);
        String computedHash = VnpayUtil.hmacSHA512(vnpayProperties.getHashSecret(), hashData);
        return receivedHash.equalsIgnoreCase(computedHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Params cố định cho mỗi giao dịch VNPay
    //  - vnp_TxnRef = UUID invoice (32 ký tự, không dấu gạch)
    //  - vnp_ExpireDate = createDate + 15 phút (GMT+7)
    // ─────────────────────────────────────────────────────────────────────────
    private Map<String, String> buildBaseParams(UUID invoiceId) {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", vnpayProperties.getVersion());
        params.put("vnp_Command", vnpayProperties.getCommand());
        params.put("vnp_TmnCode", vnpayProperties.getTmnCode());
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", VnpayUtil.toTxnRef(invoiceId));
        params.put("vnp_OrderInfo", "Thanh toan hoa don " + invoiceId);
        params.put("vnp_OrderType", vnpayProperties.getOrderType());
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpayProperties.getReturnUrl());

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));
        calendar.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", formatter.format(calendar.getTime()));
        return params;
    }

    /** Ghép query string + vnp_SecureHash → URL redirect đầy đủ */
    private String buildSignedPaymentUrl(Map<String, String> params) {
        String queryUrl = VnpayUtil.buildQueryString(params, true);
        String hashData = VnpayUtil.buildQueryString(params, false);
        String secureHash = VnpayUtil.hmacSHA512(vnpayProperties.getHashSecret(), hashData);
        return vnpayProperties.getPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + secureHash;
    }
}
