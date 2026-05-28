package com.restaurant.controller.payment;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.payment.CreateVoucherRequest;
import com.restaurant.dto.request.payment.UpdateVoucherRequest;
import com.restaurant.dto.response.payment.VoucherResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.payment.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    /**
     * GET /api/vouchers
     * Danh sách tất cả voucher (phân trang) - ADMIN/MANAGER
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<VoucherResponse>>> getAllVouchers(Pageable pageable) {
        Page<VoucherResponse> vouchers = voucherService.getAllVouchers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Danh sách voucher", vouchers));
    }

    /**
     * GET /api/vouchers/{id}
     * Chi tiết voucher theo ID - ADMIN/MANAGER
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<VoucherResponse>> getById(@PathVariable UUID id) {
        VoucherResponse voucher = voucherService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết voucher", voucher));
    }

    /**
     * GET /api/vouchers/code/{code}
     * Tìm voucher theo mã - CASHIER/ADMIN/MANAGER
     */
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<VoucherResponse>> getByCode(@PathVariable String code) {
        VoucherResponse voucher = voucherService.getByCode(code);
        return ResponseEntity.ok(ApiResponse.success("Voucher tìm thấy", voucher));
    }

    /**
     * GET /api/vouchers/available
     * Danh sách voucher khả dụng (còn hạn, chưa hết lượt) - CASHIER/ADMIN/MANAGER
     */
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getAvailableVouchers() {
        List<VoucherResponse> vouchers = voucherService.getAvailableVouchers();
        return ResponseEntity.ok(ApiResponse.success("Voucher khả dụng", vouchers));
    }

    /**
     * POST /api/vouchers
     * Tạo voucher mới - ADMIN/MANAGER
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<VoucherResponse>> create(
            @Valid @RequestBody CreateVoucherRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        VoucherResponse voucher = voucherService.create(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo voucher thành công", voucher));
    }

    /**
     * PUT /api/vouchers/{id}
     * Cập nhật voucher - ADMIN/MANAGER
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<VoucherResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVoucherRequest request) {
        VoucherResponse voucher = voucherService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật voucher thành công", voucher));
    }

    /**
     * PATCH /api/vouchers/{id}/toggle
     * Bật/tắt trạng thái voucher - ADMIN/MANAGER
     */
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable UUID id) {
        voucherService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Toggle trạng thái thành công", null));
    }

    /**
     * DELETE /api/vouchers/{id}
     * Xóa (soft delete) voucher - ADMIN/MANAGER
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        voucherService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa voucher thành công", null));
    }
}
