package com.restaurant.dto.request.customer;

import com.restaurant.common.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CustomerStatusUpdateRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;
}
