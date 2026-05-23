package com.restaurant.controller.reservation;

import com.restaurant.dto.request.reservation.CreateReservationRequest;
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
import java.util.List;

@RestController
@RequestMapping("/api/public/reservations")
@RequiredArgsConstructor
public class PublicReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ReservationResponse createOnlineReservation(@Valid @RequestBody CreateReservationRequest request) {
        return reservationService.createAndConfirm(request, null);
    }

    @GetMapping("/available-dates")
    public List<LocalDate> getAvailableDates() {
        return reservationService.getAvailableDates();
    }

    @GetMapping("/available-times")
    public List<LocalTime> getAvailableTimes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Integer partySize) {
        return reservationService.getAvailableTimes(date, partySize);
    }
}
