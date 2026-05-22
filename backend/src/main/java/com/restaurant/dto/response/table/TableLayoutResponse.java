package com.restaurant.dto.response.table;

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

// THY - Response so do mat bang
// TODO:
//   List<AreaGroup>
//     String areaName
//     List<TableResponse> tables
@Data
@Builder
public class TableLayoutResponse {
    private List<TableResponse> tables;  // toàn bộ bàn

    // Thống kê nhanh cho UI hiển thị dashboard
    private Integer total;       // tổng số bàn
    private Integer available;   // bàn EMPTY
    private Integer occupied;    // bàn SERVING
    private Integer cleaning;    // bàn CLEANING
}
