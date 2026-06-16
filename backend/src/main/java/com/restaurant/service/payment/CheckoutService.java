package com.restaurant.service.payment;

import com.restaurant.dto.request.payment.CheckoutRequest;
import com.restaurant.dto.response.payment.CheckoutResponse;
import com.restaurant.dto.response.payment.InvoiceResponse;
import com.restaurant.dto.response.payment.PaymentResponse;
import com.restaurant.dto.response.payment.VnpayCallbackResponse;

import java.util.Map;
import java.util.UUID;

public interface CheckoutService {
    CheckoutResponse previewCheckout(CheckoutRequest request);
    InvoiceResponse processCashPayment(CheckoutRequest request, UUID cashierId);
    PaymentResponse createVnpayPayment(CheckoutRequest request, UUID cashierId, String ipAddress, String bankCode);
    VnpayCallbackResponse confirmVnpayPayment(Map<String, String> params);
}
