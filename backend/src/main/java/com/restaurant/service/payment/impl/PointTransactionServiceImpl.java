package com.restaurant.service.payment.impl;

import com.restaurant.common.enums.PointTransactionType;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.dto.response.payment.PointTransactionResponse;
import com.restaurant.model.Customer;
import com.restaurant.model.PointTransaction;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.PointTransactionRepository;
import com.restaurant.service.payment.PointTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PointTransactionServiceImpl implements PointTransactionService {

    private final PointTransactionRepository pointTransactionRepository;
    private final CustomerRepository customerRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lịch sử giao dịch điểm của một customer (phân trang)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<PointTransactionResponse> getByCustomerId(UUID customerId, Pageable pageable) {
        return pointTransactionRepository.findByCustomerId(customerId, pageable)
                .map(this::toResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Giao dịch điểm gắn với một hóa đơn
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<PointTransactionResponse> getByInvoiceId(UUID invoiceId) {
        return pointTransactionRepository.findByInvoiceId(invoiceId).stream()
                .map(this::toResponse)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EARN: Tích điểm sau thanh toán thành công
    //  - Ghi PointTransaction type=EARNED
    //  - Cập nhật currentPoints và totalPointsEarned của customer
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void earnPoints(UUID customerId, UUID invoiceId, int points, UUID createdBy) {
        if (points <= 0) return;

        Customer customer = findCustomerOrThrow(customerId);

        PointTransaction txn = PointTransaction.builder()
                .customerId(customerId)
                .invoiceId(invoiceId)
                .type(PointTransactionType.EARNED)
                .points(points)
                .note("Tích điểm từ hóa đơn")
                .createdBy(createdBy)
                .build();
        pointTransactionRepository.save(txn);

        customer.setCurrentPoints(customer.getCurrentPoints() + points);
        customer.setTotalPointsEarned(customer.getTotalPointsEarned() + points);
        customerRepository.save(customer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REDEEM: Đổi điểm khi thanh toán
    //  - Kiểm tra customer đủ điểm
    //  - Ghi PointTransaction type=REDEEMED (points âm)
    //  - Trừ currentPoints
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void redeemPoints(UUID customerId, UUID invoiceId, int points, UUID createdBy) {
        if (points <= 0) return;

        Customer customer = findCustomerOrThrow(customerId);

        if (customer.getCurrentPoints() < points) {
            throw new BusinessException("Khách hàng không đủ điểm. Hiện có: "
                    + customer.getCurrentPoints() + ", yêu cầu: " + points);
        }

        PointTransaction txn = PointTransaction.builder()
                .customerId(customerId)
                .invoiceId(invoiceId)
                .type(PointTransactionType.REDEEMED)
                .points(-points)  // Âm cho redeemed
                .note("Đổi điểm thanh toán")
                .createdBy(createdBy)
                .build();
        pointTransactionRepository.save(txn);

        customer.setCurrentPoints(customer.getCurrentPoints() - points);
        customerRepository.save(customer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADJUST: Điều chỉnh điểm thủ công (ADMIN/MANAGER) hoặc hoàn điểm khi void
    //  - points dương = cộng, âm = trừ (floor tại 0)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void adjustPoints(UUID customerId, int points, String note, UUID createdBy) {
        Customer customer = findCustomerOrThrow(customerId);

        PointTransaction txn = PointTransaction.builder()
                .customerId(customerId)
                .type(PointTransactionType.ADJUSTED)
                .points(points)
                .note(note != null ? note : "Điều chỉnh điểm thủ công")
                .createdBy(createdBy)
                .build();
        pointTransactionRepository.save(txn);

        customer.setCurrentPoints(customer.getCurrentPoints() + points);
        if (customer.getCurrentPoints() < 0) {
            customer.setCurrentPoints(0);
        }
        customerRepository.save(customer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private Customer findCustomerOrThrow(UUID customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
    }

    /** Map PointTransaction entity → PointTransactionResponse DTO */
    private PointTransactionResponse toResponse(PointTransaction txn) {
        return PointTransactionResponse.builder()
                .id(txn.getId())
                .customerId(txn.getCustomerId())
                .invoiceId(txn.getInvoiceId())
                .type(txn.getType())
                .points(txn.getPoints())
                .note(txn.getNote())
                .createdBy(txn.getCreatedBy())
                .createdAt(txn.getCreatedAt())
                .build();
    }
}
