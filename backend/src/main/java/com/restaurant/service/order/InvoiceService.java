package com.restaurant.service.order;

import com.restaurant.common.utils.PageResponse;
import com.restaurant.dto.response.order.InvoiceResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Methods:
//   Page<InvoiceResponse> getInvoices(LocalDate date, UUID cashierId, Pageable pageable)
//   InvoiceResponse getById(UUID id)
//   InvoiceResponse getByOrderId(UUID orderId)
//   InvoiceResponse voidInvoice(UUID id, String reason, UUID voidedBy)
//   String generateInvoiceHtml(UUID id)
//   void sendInvoiceEmail(UUID id)
public interface InvoiceService {
    PageResponse<List<InvoiceResponse>> getInvoices(LocalDate date, UUID cashierId, Pageable pageable);
    InvoiceResponse getById(UUID id);
    InvoiceResponse getByOrderId(UUID orderId);
    InvoiceResponse voidInvoice(UUID id, String reason, UUID voidedBy);
    String generateInvoiceHtml(UUID id);
    void sendInvoiceEmail(UUID id);
}