package com.restaurant.model;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.common.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

// Entity: Invoice (Hoa don)
// @Entity @Table(name = "invoices")
// Fields:
//   - id               : UUID, PK
//   - orderId          : UUID, FK → orders.id
//   - cashierId        : UUID, FK → users.id
//   - subtotal         : DECIMAL(12,0)
//   - voucherId        : UUID, FK → vouchers.id
//   - discountAmount    : DECIMAL(12,0)
//   - pointsUsed       : INT
//   - pointsDeducted   : DECIMAL(12,0)
//   - vatRate          : DECIMAL(5,2)
//   - vatAmount        : DECIMAL(12,0)
//   - totalAmount      : DECIMAL(12,0)
//   - paymentMethod    : VARCHAR(15) [cash|vnpay]
//   - customerId       : UUID, FK → customers.id
//   - customerPhone    : VARCHAR(15)
//   - pointsEarned     : INT
//   - status           : VARCHAR(10) [paid|voided]
//   - voidReason       : TEXT
//   - voidedBy         : UUID, FK → users.id
//   - createdAt        : TIMESTAMPTZ
// Annotations: @Enumerated for paymentMethod & status
@Entity
@jakarta.persistence.Table(name = "invoices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "cashier_id")
    private UUID cashierId;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "voucher_id")
    private UUID voucherId;

    @Column(name = "discount_amount")
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "points_used")
    @Builder.Default
    private Integer pointsUsed = 0;

    @Column(name = "points_deducted")
    @Builder.Default
    private BigDecimal pointsDeducted = BigDecimal.ZERO;

    @Column(name = "vat_rate")
    @Builder.Default
    private BigDecimal vatRate = BigDecimal.ZERO;

    @Column(name = "vat_amount")
    @Builder.Default
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 15)
    private PaymentMethod paymentMethod;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_phone", length = 15)
    private String customerPhone;

    @Column(name = "points_earned")
    @Builder.Default
    private Integer pointsEarned = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.PENDING;
    // PENDING = vừa tạo (chờ thanh toán VNPay hoặc chờ thu tiền mặt)
    // Chỉ chuyển PAID sau khi: CASH được xác nhận, hoặc VNPay callback thành công

    @Column(name = "void_reason")
    private String voidReason;

    @Column(name = "voided_by")
    private UUID voidedBy;

    @Column(name = "vnp_txn_ref", length = 32, unique = true)
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 32)
    private String vnpTransactionNo;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    
    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}