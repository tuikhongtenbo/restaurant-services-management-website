package com.restaurant.dto.request.reservation;

import com.restaurant.common.enums.ReservationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Data
public class UpdateReservationRequest {

    @NotNull(message = "Trạng thái không được trống")
    private ReservationStatus status;

    private String cancelReason;  // Chỉ cần khi status = CANCELLED
}

// THY - Sua dat ban
// TODO:
// String customerName
// String customerPhone
// Integer partySize
// LocalDateTime reservedAt
// String note