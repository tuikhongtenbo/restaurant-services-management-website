package com.restaurant.dto.response.auth;

import com.restaurant.common.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CustomerResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private UserStatus status;
    private String tier;
    private BigDecimal totalSpent;
    private Integer currentPoints;
    private LocalDate dateOfBirth;
}
