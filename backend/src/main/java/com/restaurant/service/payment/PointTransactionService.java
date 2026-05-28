package com.restaurant.service.payment;

import com.restaurant.dto.response.payment.PointTransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

public interface PointTransactionService {
    Page<PointTransactionResponse> getByCustomerId(UUID customerId, Pageable pageable);
    List<PointTransactionResponse> getByInvoiceId(UUID invoiceId);
    void earnPoints(UUID customerId, UUID invoiceId, int points, UUID createdBy);
    void redeemPoints(UUID customerId, UUID invoiceId, int points, UUID createdBy);
    void adjustPoints(UUID customerId, int points, String note, UUID createdBy);
}
