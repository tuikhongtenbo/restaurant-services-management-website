package com.restaurant.controller.reservation;

// THY
// @RestController @RequestMapping("/api/reservations")
//
// GET    /                          → Page<ReservationResponse> (filter: date, status)
// GET    /calendar                  → ReservationCalendarResponse
// GET    /available-slots            → List<AvailableSlot> (ngay, so nguoi)
// GET    /suggest-table             → TableResponse (goi y ban)
// GET    /{id}                     → ReservationResponse
// POST   /                          → ReservationResponse (create)
// PUT    /{id}                     → ReservationResponse (update)
// PUT    /{id}/confirm             → ReservationResponse
// PUT    /{id}/arrived             → ReservationResponse (auto open table)
// PUT    /{id}/no-show             → ReservationResponse
// PUT    /{id}/cancel              → ReservationResponse
// DELETE /{id}                     → void (Manager only)
public class ReservationController {
}
