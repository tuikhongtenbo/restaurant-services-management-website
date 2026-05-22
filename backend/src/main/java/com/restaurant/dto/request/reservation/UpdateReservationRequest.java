package com.restaurant.dto.request.reservation;

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

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReservationRequest {

    @NotBlank(message = "Tên khách không được trống")
    @Size(max = 100, message = "Tên không quá 100 ký tự")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được trống")
    private String customerPhone;

    @NotNull(message = "Số người không được trống")
    @Min(value = 1)
    @Max(value = 50)
    private Integer partySize;

    @NotNull(message = "Giờ đặt bàn không được trống")
    private OffsetDateTime reservedAt;

    private String note;
}
// THY - Sua dat ban
// TODO:
// String customerName
// String customerPhone
// Integer partySize
// LocalDateTime reservedAt
// String note