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

// THY - Mo ban
// TODO:
// @NotNull Integer guestCount
// UUID waiterId (nullable - neu khong truyen thi tu gan)
@Data
public class OpenTableRequest {

    private UUID reservationId;

    @NotNull
    @Min(value = 1)
    private Integer actualGuestCount;
}
