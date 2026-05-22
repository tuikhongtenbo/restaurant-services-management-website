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