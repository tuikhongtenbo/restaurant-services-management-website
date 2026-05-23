package com.restaurant.controller.reservation;

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.dto.request.reservation.CancelReservationRequest;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.dto.response.table.TableResponse;
import com.restaurant.service.reservation.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public Page<ReservationResponse> getReservations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) ReservationStatus status,
            Pageable pageable) {
        return reservationService.getReservations(date, status, pageable);
    }

    @GetMapping("/calendar")
    public ReservationCalendarResponse getCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reservationService.getCalendar(date);
    }

    @GetMapping("/{id}")
    public ReservationResponse getById(@PathVariable UUID id) {
        return reservationService.getById(id);
    }

    @PostMapping
    public ReservationResponse createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @RequestHeader(value = "X-Staff-ID", required = false) UUID staffId) {
        return reservationService.createAndConfirm(request, staffId);
    }

    @PutMapping("/{id}")
    public ReservationResponse updateReservation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReservationRequest request) {
        return reservationService.update(id, request);
    }

    @PutMapping("/{id}/arrived")
    public ReservationResponse markAsArrived(@PathVariable UUID id) {
        return reservationService.arrived(id);
    }

    @PutMapping("/{id}/no-show")
    public ReservationResponse markAsNoShow(@PathVariable UUID id) {
        return reservationService.noShow(id);
    }

    @PutMapping("/{id}/cancel")
    public ReservationResponse cancelReservation(
            @PathVariable UUID id,
            @RequestBody CancelReservationRequest request,
            @RequestHeader(value = "X-Staff-ID", required = false) UUID staffId) {
        return reservationService.cancel(id, staffId, request.getReason());
    }

    @GetMapping("/available-slots")
    public List<LocalTime> getAvailableSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Integer partySize) {
        return reservationService.getAvailableSlots(date, partySize);
    }

    @GetMapping("/suggest-table")
    public TableResponse suggestTable(@RequestParam Integer partySize) {
        return reservationService.suggestTable(partySize);
    }

    @DeleteMapping("/{id}")
    public void deleteReservation(@PathVariable UUID id) {
        reservationService.delete(id);
    }
}
