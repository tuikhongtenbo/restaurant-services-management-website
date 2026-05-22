package com.restaurant.dto.response.reservation;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @Builder
public class ReservationCalendarResponse {
    private LocalDate date;
    private List<ReservationResponse> reservations;
    private Integer totalReservations;
    private Integer pending;
    private Integer confirmed;
    private Integer arrived;
    private Integer cancelled;
}