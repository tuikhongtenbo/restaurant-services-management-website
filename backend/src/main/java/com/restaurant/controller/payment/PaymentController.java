package com.restaurant.controller.payment;

import com.restaurant.common.enums.PaymentMethod;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.common.utils.VnpayUtil;
import com.restaurant.config.VnpayProperties;
import com.restaurant.dto.request.payment.CheckoutRequest;
import com.restaurant.dto.request.payment.VoidInvoiceRequest;
import com.restaurant.dto.request.payment.VnpayCreateRequest;
import com.restaurant.dto.response.payment.CheckoutResponse;
import com.restaurant.dto.response.payment.InvoiceResponse;
import com.restaurant.dto.response.payment.PaymentResponse;
import com.restaurant.dto.response.payment.VnpayCallbackResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.payment.CheckoutService;
import com.restaurant.service.payment.InvoiceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final CheckoutService checkoutService;
    private final InvoiceService invoiceService;
    private final VnpayProperties vnpayProperties;

    /**
     * POST /api/payments/checkout
     * Preview checkout - tính toán trước khi thanh toán
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<CheckoutResponse>> previewCheckout(
            @Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.previewCheckout(request);
        return ResponseEntity.ok(ApiResponse.success("Preview checkout thành công", response));
    }

    /**
     * POST /api/payments/cash
     * Thanh toán tiền mặt
     */
    @PostMapping("/cash")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> processCashPayment(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        InvoiceResponse response = checkoutService.processCashPayment(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thanh toán thành công", response));
    }

    /**
     * POST /api/payments/vnpay/create
     * Tạo hóa đơn PENDING và URL redirect VNPay sandbox/prod.
     */
    @PostMapping("/vnpay/create")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> createVnpayPayment(
            @Valid @RequestBody VnpayCreateRequest request,
            HttpServletRequest httpRequest,
            @AuthenticationPrincipal CustomUserDetails principal) {
        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .orderId(request.getOrderId())
                .customerPhone(request.getCustomerPhone())
                .voucherId(request.getVoucherId())
                .pointsToUse(request.getPointsToUse())
                .paymentMethod(PaymentMethod.VNPAY)
                .build();
        PaymentResponse response = checkoutService.createVnpayPayment(
                checkoutRequest,
                principal.getId(),
                VnpayUtil.getIpAddress(httpRequest),
                request.getBankCode());
        return ResponseEntity.ok(ApiResponse.success("Tạo URL VNPay thành công", response));
    }

    /**
     * GET /api/payments/vnpay/return
     * VNPay redirect user về — verify chữ ký, chốt hóa đơn, redirect frontend.
     */
    @GetMapping("/vnpay/return")
    public void vnpayReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        VnpayCallbackResponse result = checkoutService.confirmVnpayPayment(VnpayUtil.extractVnpParams(request));
        response.sendRedirect(buildFrontendRedirectUrl(result));
    }

    /**
     * GET/POST /api/payments/vnpay/ipn
     * IPN server-to-server từ VNPay (idempotent).
     */
    @RequestMapping(value = "/vnpay/ipn", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> vnpayIpn(HttpServletRequest request) {
        try {
            VnpayCallbackResponse result = checkoutService.confirmVnpayPayment(VnpayUtil.extractVnpParams(request));
            if (result.isSuccess()) {
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
            }
            return ResponseEntity.ok(Map.of("RspCode", "02", "Message", "Confirm Failed"));
        } catch (Exception ex) {
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error"));
        }
    }

    /**
     * POST /api/payments/{id}/void
     * Hủy hóa đơn
     */
    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> voidInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody VoidInvoiceRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        InvoiceResponse response = invoiceService.voidInvoice(id, request.getVoidReason(), principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Hủy hóa đơn thành công", response));
    }

    /**
     * GET /api/payments/invoices
     * Danh sách hóa đơn (có filter theo ngày)
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> getInvoices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            Pageable pageable) {
        Page<InvoiceResponse> invoices;
        if (from != null && to != null) {
            invoices = invoiceService.getInvoicesByDateRange(from, to, pageable);
        } else {
            invoices = invoiceService.getInvoices(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success("Danh sách hóa đơn", invoices));
    }

    /**
     * GET /api/payments/invoices/{id}
     * Chi tiết hóa đơn
     */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable UUID id) {
        InvoiceResponse response = invoiceService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết hóa đơn", response));
    }

    private String buildFrontendRedirectUrl(VnpayCallbackResponse result) {
        StringBuilder url = new StringBuilder(vnpayProperties.getFrontendReturnUrl());
        url.append("?success=").append(result.isSuccess());
        url.append("&responseCode=").append(result.getResponseCode() != null ? result.getResponseCode() : "");
        if (result.getInvoiceId() != null) {
            url.append("&invoiceId=").append(result.getInvoiceId());
        }
        if (result.getOrderId() != null) {
            url.append("&orderId=").append(result.getOrderId());
        }
        url.append("&message=").append(URLEncoder.encode(
                result.getMessage() != null ? result.getMessage() : "", StandardCharsets.UTF_8));
        return url.toString();
    }
}
