package com.restaurant.dto.request.reservation;

import javax.annotation.processing.Generated;
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

// THY - Huy dat ban
// TODO:
// String reason
@Data
public class CancelReservationRequest {
    private String reason;
}
