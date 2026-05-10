package com.restaurant.dto.request.table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// THY - Mo ban
// TODO:
// @NotNull Integer guestCount
// UUID waiterId (nullable - neu khong truyen thi tu gan)
@Getter
@Setter
public class OpenTableRequest {

    private UUID reservationId;

    @NotNull
    @Min(value = 1)
    private Integer actualGuestCount;
}
