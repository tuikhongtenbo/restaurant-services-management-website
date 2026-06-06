package com.restaurant.dto.response.table;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class TableResponse {
    private UUID id;
    private String number;
    private Integer capacity;
    private String status;
    private String area;
    private Boolean isActive;
    private OffsetDateTime updatedAt;
    private OffsetDateTime deleteAt;
}
