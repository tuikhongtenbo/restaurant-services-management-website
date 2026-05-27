package com.restaurant.common.utils;

import jakarta.servlet.http.HttpServletRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public final class VnpayUtil {

    private VnpayUtil() {
    }

    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute VNPay HMAC", ex);
        }
    }

    public static String buildQueryString(Map<String, String> params, boolean encodeKeys) {
        return params.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isEmpty())
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> (encodeKeys ? URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII) : entry.getKey())
                        + "="
                        + URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                .collect(Collectors.joining("&"));
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress != null && !ipAddress.isBlank()) {
            return ipAddress.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public static Map<String, String> extractVnpParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> names = request.getParameterNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            if (name.startsWith("vnp_")) {
                params.put(name, request.getParameter(name));
            }
        }
        return params;
    }

    public static long toVnpAmount(BigDecimal amountVnd) {
        return amountVnd.multiply(BigDecimal.valueOf(100)).longValue();
    }

    public static String toTxnRef(java.util.UUID invoiceId) {
        return invoiceId.toString().replace("-", "");
    }

    public static java.util.UUID fromTxnRef(String txnRef) {
        if (txnRef == null || txnRef.length() != 32) {
            throw new IllegalArgumentException("Invalid vnp_TxnRef");
        }
        return java.util.UUID.fromString(
                txnRef.substring(0, 8) + "-"
                        + txnRef.substring(8, 12) + "-"
                        + txnRef.substring(12, 16) + "-"
                        + txnRef.substring(16, 20) + "-"
                        + txnRef.substring(20));
    }
}
