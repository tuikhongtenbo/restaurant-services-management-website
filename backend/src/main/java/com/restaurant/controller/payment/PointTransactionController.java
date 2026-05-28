package com.restaurant.controller.payment;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.payment.AdjustPointsRequest;
import com.restaurant.dto.response.payment.PointTransactionResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.payment.PointTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/point-transactions")
@RequiredArgsConstructor
public class PointTransactionController {

    private final PointTransactionService pointTransactionService;

    /**
     * GET /api/point-transactions/customer/{customerId}
     * Lịch sử điểm của khách hàng (phân trang) - CASHIER/ADMIN/MANAGER
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<PointTransactionResponse>>> getByCustomerId(
            @PathVariable UUID customerId, Pageable pageable) {
        Page<PointTransactionResponse> transactions = pointTransactionService.getByCustomerId(customerId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử điểm", transactions));
    }

    /**
     * GET /api/point-transactions/invoice/{invoiceId}
     * Giao dịch điểm theo hóa đơn - CASHIER/ADMIN/MANAGER
     */
    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<PointTransactionResponse>>> getByInvoiceId(
            @PathVariable UUID invoiceId) {
        List<PointTransactionResponse> transactions = pointTransactionService.getByInvoiceId(invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Giao dịch điểm theo hóa đơn", transactions));
    }

    /**
     * POST /api/point-transactions/adjust
     * Điều chỉnh điểm thủ công - ADMIN/MANAGER
     */
    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> adjustPoints(
            @Valid @RequestBody AdjustPointsRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        pointTransactionService.adjustPoints(
                request.getCustomerId(), request.getPoints(), request.getNote(), principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh điểm thành công", null));
    }
}
