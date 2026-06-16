package com.restaurant.controller.customer;

import com.restaurant.common.enums.UserStatus;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.customer.CustomerCreateRequest;
import com.restaurant.dto.request.customer.CustomerStatusUpdateRequest;
import com.restaurant.dto.request.customer.CustomerUpdateRequest;
import com.restaurant.dto.request.payment.AdjustPointsRequest;
import com.restaurant.dto.response.auth.CustomerResponse;
import com.restaurant.dto.response.payment.PointTransactionResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.customer.CustomerManagementService;
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
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerManagementService customerService;
    private final PointTransactionService pointTransactionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getAllCustomers(Pageable pageable) {
        Page<CustomerResponse> customers = customerService.getAllCustomers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Danh sách khách hàng", customers));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> searchCustomer(@RequestParam String phone) {
        List<CustomerResponse> customers = customerService.searchByPhone(phone);
        return ResponseEntity.ok(ApiResponse.success("Kết quả tìm kiếm", customers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable UUID id) {
        CustomerResponse customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success("Chi tiết khách hàng", customer));
    }

    @GetMapping("/{id}/tier")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<String>> getCustomerTier(@PathVariable UUID id) {
        CustomerResponse customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success("Hạng khách hàng", customer.getTier()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerResponse customer = customerService.createCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo khách hàng thành công", customer));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable UUID id, @Valid @RequestBody CustomerUpdateRequest request) {
        CustomerResponse customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", customer));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updateCustomerStatus(
            @PathVariable UUID id, @Valid @RequestBody CustomerStatusUpdateRequest request) {
        customerService.updateCustomerStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xoá khách hàng", null));
    }

    @PostMapping("/{id}/adjust-points")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> adjustPoints(
            @PathVariable UUID id,
            @Valid @RequestBody AdjustPointsRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        // Bỏ qua customerId trong body nếu có, dùng id trên path
        pointTransactionService.adjustPoints(id, request.getPoints(), request.getNote(), principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh điểm thành công", null));
    }

    @GetMapping("/{id}/transactions")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<PointTransactionResponse>>> getTransactions(
            @PathVariable UUID id, Pageable pageable) {
        Page<PointTransactionResponse> transactions = pointTransactionService.getByCustomerId(id, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử giao dịch điểm", transactions));
    }

    // API cho chính khách hàng đang đăng nhập
    @GetMapping("/me/history")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<PointTransactionResponse>>> getMyHistory(
            @AuthenticationPrincipal CustomUserDetails principal, Pageable pageable) {
        // Tạm thời trả về lịch sử điểm giao dịch cho cá nhân
        Page<PointTransactionResponse> history = pointTransactionService.getByCustomerId(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử giao dịch của bạn", history));
    }

    @PutMapping("/change-profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> changeProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CustomerUpdateRequest request) {
        CustomerResponse customer = customerService.updateCustomer(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", customer));
    }
}