package com.restaurant.model;

// MINH - Entity: Invoice (Hoa don)
// TODO: Implement Invoice entity
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
//   - paymentMethod    : VARCHAR(15) [cash|qr|vnpay|momo|zalopay]
//   - customerId       : UUID, FK → customers.id
//   - customerPhone    : VARCHAR(15)
//   - pointsEarned     : INT
//   - status           : VARCHAR(10) [paid|voided]
//   - voidReason       : TEXT
//   - voidedBy         : UUID, FK → users.id
//   - createdAt        : TIMESTAMPTZ
// Annotations: @Enumerated for paymentMethod & status
public class Invoice {
    // TODO: implement fields, constructors, getters/setters
}
