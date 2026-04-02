package com.restaurant.controller.payment;

// SINH
// @RestController @RequestMapping("/api/payments")
// @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
//
// POST   /checkout                 → CheckoutResponse (preview)
// POST   /cash                     → InvoiceResponse (thanh toan tien mat)
// GET    /qr                       → PaymentResponse (sinh QR)
// POST   /vnpay/create             → PaymentResponse
// GET    /vnpay/return             → InvoiceResponse (VNPay IPN callback)
// POST   /momo/create              → PaymentResponse
// POST   /momo/return              → InvoiceResponse
// POST   /zalopay/create           → PaymentResponse
// POST   /zalopay/return           → InvoiceResponse
public class PaymentController {
}
