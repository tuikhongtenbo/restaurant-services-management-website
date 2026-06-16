package com.restaurant.service.payment;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface VnpayService {
    String createPaymentUrl(UUID invoiceId, BigDecimal amount, String ipAddress, String bankCode);

    boolean verifySignature(Map<String, String> params);
}
