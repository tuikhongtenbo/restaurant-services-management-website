package com.restaurant.service.payment.impl;

import com.restaurant.common.enums.CustomerTier;
import com.restaurant.common.enums.VoucherDiscountType;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.dto.request.payment.CreateVoucherRequest;
import com.restaurant.dto.request.payment.UpdateVoucherRequest;
import com.restaurant.dto.response.payment.VoucherResponse;
import com.restaurant.model.Voucher;
import com.restaurant.repository.VoucherRepository;
import com.restaurant.service.payment.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Danh sách voucher (phân trang)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<VoucherResponse> getAllVouchers(Pageable pageable) {
        // Dùng findAllActive để tự động lọc bỏ voucher đã bị xoá mềm
        return voucherRepository.findAllActive(pageable).map(this::toResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Chi tiết voucher theo id
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public VoucherResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Tra cứu voucher theo mã code
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public VoucherResponse getByCode(String code) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "code", code));
        // Không tiết lộ lý do xoá cho client
        if (voucher.isDeleted()) {
            throw new ResourceNotFoundException("Voucher", "code", code);
        }
        return toResponse(voucher);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE: Tạo voucher mới (ADMIN/MANAGER)
    //  - Mã code phải unique (uppercase)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public VoucherResponse create(CreateVoucherRequest request, UUID createdBy) {
        if (voucherRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Mã voucher '" + request.getCode() + "' đã tồn tại");
        }

        Voucher voucher = Voucher.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderValue(request.getMinOrderValue())
                .minTier(request.getMinTier() != null ? request.getMinTier() : CustomerTier.MEMBER)
                .minPoints(request.getMinPoints())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .usageLimit(request.getUsageLimit())
                .createdBy(createdBy)
                .build();

        return toResponse(voucherRepository.save(voucher));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE: Cập nhật thông tin voucher (partial update)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public VoucherResponse update(UUID id, UpdateVoucherRequest request) {
        Voucher voucher = findOrThrow(id);

        if (request.getDescription() != null) voucher.setDescription(request.getDescription());
        if (request.getDiscountType() != null) voucher.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) voucher.setDiscountValue(request.getDiscountValue());
        if (request.getMinOrderValue() != null) voucher.setMinOrderValue(request.getMinOrderValue());
        if (request.getMinTier() != null) voucher.setMinTier(request.getMinTier());
        if (request.getMinPoints() != null) voucher.setMinPoints(request.getMinPoints());
        if (request.getValidFrom() != null) voucher.setValidFrom(request.getValidFrom());
        if (request.getValidUntil() != null) voucher.setValidUntil(request.getValidUntil());
        if (request.getUsageLimit() != null) voucher.setUsageLimit(request.getUsageLimit());
        if (request.getIsActive() != null) voucher.setIsActive(request.getIsActive());

        return toResponse(voucher);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOGGLE: Bật/tắt voucher (isActive)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void toggleActive(UUID id) {
        Voucher voucher = findOrThrow(id);
        voucher.setIsActive(!voucher.getIsActive());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE: Soft delete thực sự — đánh dấu deletedAt thay vì chỉ tắt isActive.
    // Voucher đã deleted sẽ biến mất khỏi mọi danh sách và không thể áp dụng.
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void delete(UUID id) {
        Voucher voucher = findOrThrow(id);
        voucher.setIsActive(false);
        voucher.setDeletedAt(OffsetDateTime.now());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATE: Kiểm tra điều kiện voucher và tính số tiền giảm
    //  - Kiểm tra: active, thời hạn, usageLimit, minOrderValue, tier, points
    //  - PERCENT: subtotal × discountValue / 100
    //  - FIXED: min(discountValue, subtotal)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public BigDecimal validateAndCalculateDiscount(UUID voucherId, BigDecimal subtotal,
                                                   String customerTier, Integer customerPoints) {
        Voucher voucher = findOrThrow(voucherId);
        OffsetDateTime now = OffsetDateTime.now();

        // Validate trạng thái và thời hạn
        if (!voucher.getIsActive()) {
            throw new BusinessException("Voucher không còn hoạt động");
        }
        if (voucher.getValidFrom() != null && now.isBefore(voucher.getValidFrom())) {
            throw new BusinessException("Voucher chưa đến thời gian sử dụng");
        }
        if (voucher.getValidUntil() != null && now.isAfter(voucher.getValidUntil())) {
            throw new BusinessException("Voucher đã hết hạn");
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new BusinessException("Voucher đã hết lượt sử dụng");
        }
        if (voucher.getMinOrderValue() != null && subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new BusinessException("Giá trị đơn hàng tối thiểu phải đạt " + voucher.getMinOrderValue());
        }

        // Validate hạng khách và điểm tối thiểu
        if (voucher.getMinTier() != null && customerTier != null) {
            CustomerTier requiredTier = voucher.getMinTier();
            CustomerTier actualTier = CustomerTier.valueOf(customerTier.toUpperCase());
            if (actualTier.ordinal() < requiredTier.ordinal()) {
                throw new BusinessException("Khách hàng cần đạt hạng " + requiredTier + " trở lên");
            }
        }

        // Validate điểm
        if (voucher.getMinPoints() != null && customerPoints != null
                && customerPoints < voucher.getMinPoints()) {
            throw new BusinessException("Khách hàng cần tối thiểu " + voucher.getMinPoints() + " điểm");
        }

        // Tính discount theo loại PERCENT hoặc FIXED
        if (voucher.getDiscountType() == VoucherDiscountType.PERCENT) {
            return subtotal.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        } else {
            // FIXED: discount = min(discountValue, subtotal)
            return voucher.getDiscountValue().min(subtotal);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Danh sách voucher đang khả dụng (active + còn hạn + còn lượt)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getAvailableVouchers() {
        return voucherRepository.findAvailableVouchers().stream()
                .map(this::toResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private Voucher findOrThrow(UUID id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
        // Không tiết lộ lý do xoá cho client
        if (voucher.isDeleted()) {
            throw new ResourceNotFoundException("Voucher", "id", id);
        }
        return voucher;
    }

    /** Map Voucher entity → VoucherResponse DTO */
    private VoucherResponse toResponse(Voucher v) {
        return VoucherResponse.builder()
                .id(v.getId())
                .code(v.getCode())
                .description(v.getDescription())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .minOrderValue(v.getMinOrderValue())
                .minTier(v.getMinTier())
                .minPoints(v.getMinPoints())
                .validFrom(v.getValidFrom())
                .validUntil(v.getValidUntil())
                .usageLimit(v.getUsageLimit())
                .usedCount(v.getUsedCount())
                .isActive(v.getIsActive())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
