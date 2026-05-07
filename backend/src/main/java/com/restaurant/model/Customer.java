package com.restaurant.model;

import com.restaurant.common.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@jakarta.persistence.Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 15, unique = true)
    private String phone;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(length = 150, unique = true)
    private String email;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(length = 10)
    @Builder.Default
    private String tier = "member";

    @Column(name = "total_spent", precision = 12, scale = 0)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "total_points_earned")
    @Builder.Default
    private Integer totalPointsEarned = 0;

    @Column(name = "current_points")
    @Builder.Default
    private Integer currentPoints = 0;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
