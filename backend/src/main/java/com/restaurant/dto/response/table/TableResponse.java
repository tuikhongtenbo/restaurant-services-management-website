package com.restaurant.dto.response.table;

import com.restaurant.common.enums.TableStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder  // Service dùng .builder() để tạo response dễ dàng
public class TableResponse {
    private UUID id;
    private String number;
    private Integer capacity;
    private TableStatus status;
    private Boolean isActive;
    // Không có updatedAt — client không cần thiết
}

// THY - Response thong tin ban
// TODO:
//   UUID id
//   String number
//   Integer capacity
//   TableStatus status
//   String area
//   Integer posX
//   Integer posY
//   Boolean isActive
//   LocalDateTime updatedAt

// dto/response/TableResponse.java