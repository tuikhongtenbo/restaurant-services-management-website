package com.restaurant.dto.response.payment;

import com.restaurant.common.enums.PointTransactionType;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PointTransactionResponse {
    private UUID id;
    private UUID customerId;
    private UUID invoiceId;
    private PointTransactionType type;
    private Integer points;
    private String note;
    private UUID createdBy;
    private OffsetDateTime createdAt;
}
