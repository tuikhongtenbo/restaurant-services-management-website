package com.restaurant.controller.reservation;

import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.response.reservation.BookingSuggestionResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.service.reservation.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/public/reservations")
@RequiredArgsConstructor
public class PublicReservationController {

    private static final ZoneId RESTAURANT_ZONE    = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int    BOOKING_HORIZON_DAYS = 30;

    private final ReservationService reservationService;

    /**
     * Khách online đặt bàn → tạo reservation PENDING.
     * Nhân viên sẽ confirm ở bước tiếp theo qua StaffReservationController.
     */
    @PostMapping
    public ReservationResponse createOnlineReservation(@Valid @RequestBody CreateReservationRequest request) {
        return reservationService.createReservation(request, null);
    }

    /**
     * Trả về danh sách ngày còn slot trống trong 30 ngày tới cho partySize cho trước.
     * Wrapper của suggestBookingSlots — chỉ lấy phần date.
     */
    @GetMapping("/available-dates")
    public List<LocalDate> getAvailableDates(
            @RequestParam Integer partySize) {

        LocalDate today   = LocalDate.now(RESTAURANT_ZONE);
        List<LocalDate>  allDates = Stream
                .iterate(today, d -> d.plusDays(1))
                .limit(BOOKING_HORIZON_DAYS)
                .collect(Collectors.toList());

        return reservationService.suggestBookingSlots(allDates, partySize)
                .stream()
                .map(BookingSuggestionResponse::getDate)
                .toList();
    }

    /**
     * Trả về danh sách giờ còn trống trong một ngày cụ thể cho partySize cho trước.
     * Wrapper của suggestBookingSlots — chỉ lấy phần availableSlots của ngày đó.
     */
    @GetMapping("/available-times")
    public List<LocalTime> getAvailableTimes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Integer partySize) {

        return reservationService.suggestBookingSlots(List.of(date), partySize)
                .stream()
                .findFirst()
                .map(BookingSuggestionResponse::getAvailableSlots)
                .orElse(List.of());
    }
}