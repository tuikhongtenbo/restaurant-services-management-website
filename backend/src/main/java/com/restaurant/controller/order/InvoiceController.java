package com.restaurant.controller.order;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.common.utils.PageResponse;
import com.restaurant.dto.request.order.VoidInvoiceRequest;
import com.restaurant.dto.response.order.InvoiceResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.order.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

// @RestController @RequestMapping("/api/invoices")
//
// GET    /                          → Page<InvoiceResponse> (filter: date, cashier)
// GET    /{id}                      → InvoiceResponse
// GET    /order/{orderId}           → InvoiceResponse (theo order)
// GET    /{id}/print                → HTML (in hóa đơn)
// PUT    /{id}/void                 → InvoiceResponse
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {
    private final InvoiceService invoiceService;
    
    /**
     * GET /api/invoices
     * Lấy danh sách hóa đơn, hỗ trợ filter theo ngày và thu ngân.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<List<InvoiceResponse>>>> getInvoices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID cashierId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getInvoices(date, cashierId, pageable)));
    }

    /**
     * GET /api/invoices/{id}
     * Lấy chi tiết một hóa đơn theo id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getById(id)));
    }

    /**
     * GET /api/invoices/order/{orderId}
     * Lấy hóa đơn gắn với một order cụ thể.
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getByOrderId(@PathVariable UUID orderId) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getByOrderId(orderId)));
    }

    /**
     * PUT /api/invoices/{id}/void
     * Hủy hóa đơn kèm lý do (chỉ khi chưa void).
     */
    @PutMapping("/{id}/void")
    public ResponseEntity<ApiResponse<InvoiceResponse>> voidInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody VoidInvoiceRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Hủy hóa đơn thành công", 
                invoiceService.voidInvoice(id, request.getReason(), userDetails.getId())));
    }

    /**
     * GET /api/invoices/{id}/print
     * Trả về HTML để in hóa đơn.
     */
    @GetMapping("/{id}/print")
    public ResponseEntity<String> printInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.generateInvoiceHtml(id));
    }
}