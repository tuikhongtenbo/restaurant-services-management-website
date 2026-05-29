package com.restaurant.service.payment;

import com.restaurant.dto.request.payment.CreateVoucherRequest;
import com.restaurant.dto.request.payment.UpdateVoucherRequest;
import com.restaurant.dto.response.payment.VoucherResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface VoucherService {
    Page<VoucherResponse> getAllVouchers(Pageable pageable);
    VoucherResponse getById(UUID id);
    VoucherResponse getByCode(String code);
    VoucherResponse create(CreateVoucherRequest request, UUID createdBy);
    VoucherResponse update(UUID id, UpdateVoucherRequest request);
    void toggleActive(UUID id);
    void delete(UUID id);
    BigDecimal validateAndCalculateDiscount(UUID voucherId, BigDecimal subtotal, String customerTier, Integer customerPoints);
    List<VoucherResponse> getAvailableVouchers();
}
