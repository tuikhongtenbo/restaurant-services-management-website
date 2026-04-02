package com.restaurant.service.customer;

// SINH
// TODO: @Service
// Methods:
//   int calculatePoints(BigDecimal amount) → tien → diem
//   BigDecimal calculateMoneyFromPoints(int points) → diem → tien
//   int calculateTierUpgrades() → @Scheduled, kiem tra va nang hang
//   void processBirthdayVouchers() → @Scheduled, gui voucher sinh nhat
//   PointTransaction earnPoints(UUID customerId, UUID invoiceId, int points, UUID createdBy)
//   PointTransaction redeemPoints(UUID customerId, UUID invoiceId, int points, UUID createdBy)
public interface PointService {
}
