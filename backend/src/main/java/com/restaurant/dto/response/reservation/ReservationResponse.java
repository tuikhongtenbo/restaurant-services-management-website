package com.restaurant.dto.response.reservation;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {
    private UUID id;
    private String customerName;
    private String customerPhone;
    private Integer partySize;
    private OffsetDateTime reservedAt;
    private String note;
    private String status;   
    private String source;
    private UUID tableId; 
    private UUID confirmedBy;  
    private UUID cancelledBy;
    private String cancelReason;
    private OffsetDateTime createdAt;
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

