package com.restaurant.dto.request.table;

// Thêm vào đầu file, sau dòng package
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.util.List;
import java.util.UUID;
import java.time.LocalTime;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

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