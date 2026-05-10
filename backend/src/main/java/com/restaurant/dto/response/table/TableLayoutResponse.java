package com.restaurant.dto.response.table;

import lombok.Builder;
import lombok.Getter;

// THY - Response so do mat bang
// TODO:
//   List<AreaGroup>
//     String areaName
//     List<TableResponse> tables
@Getter 
@Setter 
@Builder
public class TableLayoutResponse {
    private List<TableResponse> tables;  // toàn bộ bàn

    // Thống kê nhanh cho UI hiển thị dashboard
    private Integer total;       // tổng số bàn
    private Integer available;   // bàn EMPTY
    private Integer occupied;    // bàn SERVING
    private Integer cleaning;    // bàn CLEANING
}
