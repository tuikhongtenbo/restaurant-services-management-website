package com.restaurant.controller.reservation;

// THY - Khach dat ban online (khong can login)
// @RestController @RequestMapping("/api/public/reservations")
//
// GET    /available-dates          → List<LocalDate>
// GET    /available-times           → List<LocalTime> (theo ngay + so nguoi)
// POST   /                          → ReservationResponse (dat ban online)
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.service.reservation.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/public/reservations")
@RequiredArgsConstructor
public class PublicReservationController {

    private final ReservationService reservationService;

    // POST /api/public/reservations → Đặt bàn online
    @PostMapping
    public ReservationResponse createOnlineReservation(@Valid @RequestBody CreateReservationRequest request) {
        // Truyền staffId = null để hệ thống tự ghi nhận source là ONLINE
        return reservationService.createAndConfirm(request, null);
    }
    // GET /api/public/reservations/available-dates → Lấy danh sách các ngày còn bàn trống
    
    @GetMapping("/available-dates")
    public List<LocalDate> getAvailableDates() {
        // return reservationService.getAvailableDates();
        throw new UnsupportedOperationException("Cần bổ sung hàm getAvailableDates vào ReservationService");
    }

    // GET /api/public/reservations/available-times → Lấy các khung giờ trống trong 1 ngày dựa theo số người
    @GetMapping("/available-times")
    public List<LocalTime> getAvailableTimes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Integer partySize) {
        // return reservationService.getAvailableTimes(date, partySize);
        throw new UnsupportedOperationException("Cần bổ sung hàm getAvailableTimes vào ReservationService");
    }
    // TODO: Triển khai thêm các API sau khi Service hỗ trợ
    // GET /available-dates  → Lấy danh sách ngày còn trống
    // GET /available-times  → Lấy danh sách giờ còn trống theo ngày & partySize
}