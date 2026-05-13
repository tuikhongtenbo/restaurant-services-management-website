package com.restaurant.dto.request.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Data
// Không cần @Builder ở đây — DTO chỉ nhận data từ client
public class CreateTableRequest {

    @NotBlank(message = "Số bàn không được trống")
    // @NotBlank = không null + không rỗng "" + không chỉ có khoảng trắng
    private String number;  // "01", "VIP-A"

    @NotNull(message = "Sức chứa không được trống")
    @Min(value = 1, message = "Sức chứa phải lớn hơn 0")
    private Integer capacity;
}

// THY
// TODO:
// @NotBlank String number
// @NotNull @Min(1) Integer capacity
// String area (Tang_1|Tang_2|San_vuon|Phong_VIP)
// Integer posX, Integer posY (keo tha)
// dto/request/CreateTableRequest.java