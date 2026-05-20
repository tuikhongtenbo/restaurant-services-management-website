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

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.dto.request.reservation.CancelReservationRequest;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.service.reservation.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    // GET /api/reservations → Lấy danh sách (có filter theo ngày, trạng thái)
    @GetMapping
    public Page<ReservationResponse> getReservations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) ReservationStatus status,
            Pageable pageable) {
        return reservationService.getReservations(date, status, pageable);
    }

    // GET /api/reservations/calendar → Lấy dữ liệu cho màn hình Lịch
    @GetMapping("/calendar")
    public ReservationCalendarResponse getCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reservationService.getCalendar(date);
    }

    // GET /api/reservations/{id} → Xem chi tiết
    @GetMapping("/{id}")
    public ReservationResponse getById(@PathVariable UUID id) {
        return reservationService.getById(id);
    }

    // POST /api/reservations → Nhân viên tạo đặt bàn hộ khách
    @PostMapping
    public ReservationResponse createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @RequestHeader(value = "X-Staff-ID", required = false) UUID staffId) { 
        // Trong thực tế, staffId nên được lấy từ Spring Security Context thay vì Header
        return reservationService.createAndConfirm(request, staffId);
    }

    // PUT /api/reservations/{id} → Sửa thông tin
    @PutMapping("/{id}")
    public ReservationResponse updateReservation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReservationRequest request) {
        return reservationService.update(id, request);
    }

    // PUT /api/reservations/{id}/arrived → Check-in khi khách tới
    @PutMapping("/{id}/arrived")
    public ReservationResponse markAsArrived(@PathVariable UUID id) {
        return reservationService.arrived(id);
    }

    // PUT /api/reservations/{id}/no-show → Đánh dấu khách không đến
    @PutMapping("/{id}/no-show")
    public ReservationResponse markAsNoShow(@PathVariable UUID id) {
        return reservationService.noShow(id);
    }

    // PUT /api/reservations/{id}/cancel → Hủy đặt bàn (Kèm lý do)
    @PutMapping("/{id}/cancel")
    public ReservationResponse cancelReservation(
            @PathVariable UUID id,
            @RequestBody CancelReservationRequest request,
            @RequestHeader(value = "X-Staff-ID", required = false) UUID staffId) {
        return reservationService.cancel(id, staffId, request.getReason());
    }

    // GET /api/reservations/available-slots → Lấy slot trống nội bộ
    @GetMapping("/available-slots")
    public Object getAvailableSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, 
            @RequestParam Integer partySize) {
        throw new UnsupportedOperationException("Chưa implement getAvailableSlots");
    }

    // GET /api/reservations/suggest-table → AI/Logic gợi ý bàn thích hợp nhất
    @GetMapping("/suggest-table")
    public Object suggestTable(@RequestParam Integer partySize) {
        throw new UnsupportedOperationException("Chưa implement suggestTable");
    }

    // DELETE /api/reservations/{id} → Xóa cứng (Hard Delete) - Chỉ dành cho Manager
    @DeleteMapping("/{id}")
    public void deleteReservation(@PathVariable UUID id) {
        throw new UnsupportedOperationException("Chưa implement thao tác xóa cứng trong DB");
    }
}
