package com.restaurant.service.order;

// SINH
// TODO: @Service
// Methods:
//   List<KdsTicketResponse> getTickets() → tat ca ticket chua served, sap xep theo thoi gian
//   KdsTicketResponse startPreparing(UUID itemId)
//   KdsTicketResponse markReady(UUID itemId) → gui notification cho waiter
//   KdsTicketResponse markServed(UUID itemId)
//   void autoRemindServed() → @Scheduled, nhac waiter sau KDS_REMINDER_MINUTES
//   void autoAlertManager() → @Scheduled, canh bao neu co don cho > threshold
public interface KdsService {
}
