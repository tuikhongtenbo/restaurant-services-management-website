package com.restaurant.dto.request.reservation;

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

@Data
public class CreateReservationRequest {

    @NotBlank(message = "Tên khách không được trống")
    @Size(max = 100, message = "Tên không quá 100 ký tự")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "SĐT không hợp lệ")
    // @Pattern = kiểm tra regex — 10 hoặc 11 chữ số
    private String customerPhone;

    @NotNull(message = "Số người không được trống")
    @Min(value = 1, message = "Ít nhất 1 người")
    @Max(value = 50, message = "Tối đa 50 người")
    private Integer partySize;

    @NotNull(message = "Giờ đặt bàn không được trống")
    @Future(message = "Giờ đặt bàn phải trong tương lai")
    // @Future = thời gian phải sau thời điểm hiện tại
    private OffsetDateTime reservedAt;

    private String note;  // Không bắt buộc
}
// THY - Tao dat ban
// TODO:
// @NotBlank String customerName
// @NotBlank String customerPhone
// @NotNull Integer partySize
// @NotNull LocalDateTime reservedAt
// String note
// ReservationSource source (STAFF | ONLINE)
// dto/request/CreateReservationRequest.java