package com.restaurant.repository;

import com.restaurant.model.PointTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, UUID> {
    List<PointTransaction> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Page<PointTransaction> findByCustomerId(UUID customerId, Pageable pageable);
    List<PointTransaction> findByCustomerIdAndCreatedAtBetween(UUID customerId, OffsetDateTime from, OffsetDateTime to);
    List<PointTransaction> findByInvoiceId(UUID invoiceId);
}
