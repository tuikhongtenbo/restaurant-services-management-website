package com.restaurant.repository;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// Custom queries:
//   - List<Invoice> findByCashierId(UUID cashierId)
//   - List<Invoice> findByCustomerId(UUID customerId)
//   - List<Invoice> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to)
//   - Optional<Invoice> findByOrderId(UUID orderId)
//   - List<Invoice> findByStatus(InvoiceStatus status)
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByOrderId(UUID orderId);
    Optional<Invoice> findByVnpTxnRef(String vnpTxnRef);
    List<Invoice> findByCashierId(UUID cashierId);
    Page<Invoice> findByCashierId(UUID cashierId, Pageable pageable);
    Page<Invoice> findByCashierIdAndCreatedAtBetween(UUID cashierId, OffsetDateTime from, OffsetDateTime to, Pageable pageable);
    List<Invoice> findByCustomerId(UUID customerId); // Lấy lịch sử mua hàng của khách
    Page<Invoice> findByCreatedAtBetween(OffsetDateTime from, OffsetDateTime to, Pageable pageable);
    List<Invoice> findByStatus(InvoiceStatus status);
}