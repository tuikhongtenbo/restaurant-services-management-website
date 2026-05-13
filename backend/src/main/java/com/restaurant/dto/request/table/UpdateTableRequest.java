package com.restaurant.dto.request.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// THY
// TODO:
// String number
// Integer capacity
// String area
// Integer posX, Integer posY
// dto/request/UpdateTableRequest.java
// ADMIN sửa thông tin bàn — giống Create, dùng riêng để sau dễ mở rộng
@Data

public class UpdateTableRequest {

    @NotBlank(message = "Số bàn không được trống")
    private String number;

    @NotNull
    @Min(value = 1)
    private Integer capacity;
}