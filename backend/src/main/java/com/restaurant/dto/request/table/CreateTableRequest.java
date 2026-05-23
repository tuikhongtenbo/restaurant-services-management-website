package com.restaurant.dto.request.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTableRequest {

    @NotBlank(message = "So ban khong duoc trong")
    @Size(max = 10, message = "So ban khong qua 10 ky tu")
    private String number;

    @NotNull(message = "Suc chua khong duoc trong")
    @Min(value = 1, message = "Suc chua phai lon hon 0")
    private Integer capacity;

    @Size(max = 50, message = "Khu vuc khong qua 50 ky tu")
    private String area;
}
