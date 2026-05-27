package com.restaurant.service.payment;

import com.restaurant.dto.response.payment.InvoiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.OffsetDateTime;
import java.util.UUID;

public interface InvoiceService {
    Page<InvoiceResponse> getInvoices(Pageable pageable);
    Page<InvoiceResponse> getInvoicesByDateRange(OffsetDateTime from, OffsetDateTime to, Pageable pageable);
    InvoiceResponse getById(UUID id);
    InvoiceResponse getByOrderId(UUID orderId);
    InvoiceResponse voidInvoice(UUID id, String reason, UUID voidedBy);
}
