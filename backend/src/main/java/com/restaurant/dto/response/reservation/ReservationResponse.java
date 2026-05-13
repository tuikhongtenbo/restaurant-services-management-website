package com.restaurant.dto.response.reservation;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder

public class ReservationResponse {
    private UUID id;
    private String customerName;
    private String customerPhone;
    private Integer partySize;
    private OffsetDateTime reservedAt;
    private String note;
    private String status;   
    private String source;
    private UUID confirmedBy;  // UUID của nhân viên confirm, sẽ map sang tên ở frontend
    private OffsetDateTime createdAt;
    // — sẽ thêm sau khi cần
}

// THY - Response dat ban
// TODO:
//   UUID id
//   String customerName
//   String customerPhone
//   Integer partySize
//   LocalDateTime reservedAt
//   String note
//   ReservationStatus status
//   ReservationSource source
//   String confirmedByName
//   LocalDateTime createdAt

