package com.restaurant.dto.request.reservation;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class ConfirmReservationRequest {
    @NotNull(message = "Vui long chon ban (tableId) khi xac nhan dat ban")
    private UUID tableId;
}
