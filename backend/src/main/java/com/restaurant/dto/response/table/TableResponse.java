package com.restaurant.dto.response.table;

import com.restaurant.common.enums.TableStatus;

import java.util.UUID;

import javax.annotation.processing.SupportedAnnotationTypes;

// Trả về cho mọi trường hợp — xem bàn, mở bàn, đóng bàn
// Các file DTO bị lỗi @Data, @Builder
// Thêm vào đầu file:
import lombok.Data;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.UUID;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.math.BigDecimal;
@Data
@Builder
public class TableResponse {
    private UUID id;
    private String number;        // "01"
    private Integer capacity;     // 4
    private String status;        // "EMPTY" | "SERVING" | "CLEANING"
    private Boolean isActive;

    // Thêm field này vì UI cần biết bàn đang có order nào
    // null = bàn đang trống
    //private UUID currentOrderId;
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