package com.restaurant.model;

// SINH - Entity: OrderItem (Chi tiet don hang)
// TODO: Implement OrderItem entity
// @Entity @Table(name = "order_items")
// Fields:
//   - id         : UUID, PK
//   - orderId    : UUID, FK → orders.id
//   - itemId     : UUID, FK → menu_items.id
//   - itemName   : VARCHAR(100) (snapshot ten mon luc dat)
//   - unitPrice  : DECIMAL(12,0)
//   - quantity   : INT DEFAULT 1
//   - note       : TEXT (VD: khong hanh, di chap)
//   - status     : VARCHAR(15) [pending|preparing|ready|served|cancelled]
//   - orderedBy  : UUID, FK → users.id
//   - orderedAt  : TIMESTAMPTZ
//   - readyAt    : TIMESTAMPTZ
//   - servedAt   : TIMESTAMPTZ
//   - cancelReason: TEXT
//   - cancelledAt: TIMESTAMPTZ
//   - cancelledBy: UUID, FK → users.id
// Annotations: @Enumerated for status
public class OrderItem {
    // TODO: implement fields, constructors, getters/setters
}
