package com.restaurant.service.payment.impl;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.dto.response.payment.InvoiceResponse;
import com.restaurant.model.Customer;
import com.restaurant.model.Invoice;
import com.restaurant.model.Voucher;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.InvoiceRepository;
import com.restaurant.repository.VoucherRepository;
import com.restaurant.service.payment.InvoiceService;
import com.restaurant.service.payment.PointTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service("paymentInvoiceServiceImpl")
@RequiredArgsConstructor
@Transactional
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final VoucherRepository voucherRepository;
    private final CustomerRepository customerRepository;
    private final PointTransactionService pointTransactionService;

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Danh sách hóa đơn (phân trang)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoices(Pageable pageable) {
        return invoiceRepository.findAll(pageable).map(this::toResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Danh sách hóa đơn theo khoảng thời gian
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoicesByDateRange(
            OffsetDateTime from, OffsetDateTime to, Pageable pageable) {
        return invoiceRepository.findByCreatedAtBetween(from, to, pageable).map(this::toResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Chi tiết hóa đơn theo id
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Hóa đơn theo orderId
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getByOrderId(UUID orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "orderId", orderId));
        return toResponse(invoice);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VOID: Hủy hóa đơn và hoàn tác side effects
    //  1. Kiểm tra chưa void
    //  2. Hoàn điểm đã dùng / trừ điểm đã tích cho customer
    //  3. Giảm voucher usedCount
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public InvoiceResponse voidInvoice(UUID id, String reason, UUID voidedBy) {
        Invoice invoice = findOrThrow(id);

        if (invoice.getStatus() == InvoiceStatus.VOIDED) {
            throw new BusinessException("Hóa đơn đã được hủy trước đó");
        }

        invoice.setStatus(InvoiceStatus.VOIDED);
        invoice.setVoidReason(reason);
        invoice.setVoidedBy(voidedBy);

        // Bước 2: Hoàn điểm cho customer
        if (invoice.getCustomerId() != null) {
            Customer customer = customerRepository.findById(invoice.getCustomerId()).orElse(null);
            if (customer != null) {
                if (invoice.getPointsUsed() != null && invoice.getPointsUsed() > 0) {
                    pointTransactionService.adjustPoints(
                            customer.getId(), invoice.getPointsUsed(),
                            "Hoàn điểm do hủy hóa đơn #" + invoice.getId(), voidedBy);
                }
                if (invoice.getPointsEarned() != null && invoice.getPointsEarned() > 0) {
                    pointTransactionService.adjustPoints(
                            customer.getId(), -invoice.getPointsEarned(),
                            "Trừ điểm tích do hủy hóa đơn #" + invoice.getId(), voidedBy);
                }
                customer.setTotalSpent(customer.getTotalSpent().subtract(invoice.getTotalAmount()));
                customerRepository.save(customer);
            }
        }

        // Bước 3: Hoàn usedCount voucher
        if (invoice.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(invoice.getVoucherId()).orElse(null);
            if (voucher != null && voucher.getUsedCount() > 0) {
                voucher.setUsedCount(voucher.getUsedCount() - 1);
                voucherRepository.save(voucher);
            }
        }

        return toResponse(invoice);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private Invoice findOrThrow(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
    }

    /** Map Invoice entity → InvoiceResponse DTO (kèm voucherCode nếu có) */
    private InvoiceResponse toResponse(Invoice inv) {
        String voucherCode = null;
        if (inv.getVoucherId() != null) {
            voucherCode = voucherRepository.findById(inv.getVoucherId())
                    .map(Voucher::getCode).orElse(null);
        }

        return InvoiceResponse.builder()
                .id(inv.getId())
                .orderId(inv.getOrderId())
                .cashierId(inv.getCashierId())
                .subtotal(inv.getSubtotal())
                .voucherCode(voucherCode)
                .discountAmount(inv.getDiscountAmount())
                .pointsUsed(inv.getPointsUsed())
                .pointsDeducted(inv.getPointsDeducted())
                .vatRate(inv.getVatRate())
                .vatAmount(inv.getVatAmount())
                .totalAmount(inv.getTotalAmount())
                .paymentMethod(inv.getPaymentMethod())
                .customerId(inv.getCustomerId())
                .customerPhone(inv.getCustomerPhone())
                .pointsEarned(inv.getPointsEarned())
                .status(inv.getStatus())
                .voidReason(inv.getVoidReason())
                .voidedBy(inv.getVoidedBy())
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
