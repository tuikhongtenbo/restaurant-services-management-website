package com.restaurant.model;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.ReservationSource;

@Entity
@jakarta.persistence.Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "customer_name", length = 100)
    private String customerName;  // Tên khách đặt bàn

    @Column(name = "customer_phone", length = 15)
    private String customerPhone;  // SĐT khách

    @Column(name = "party_size")
    private Integer partySize;  // Số người

    @Column(name = "reserved_at")
    private OffsetDateTime reservedAt;  // Giờ đặt bàn: 2025-12-25 19:00+07

    @Column(columnDefinition = "TEXT")
    // columnDefinition="TEXT" → kiểu TEXT trong PG, không giới hạn độ dài
    private String note;  // Ghi chú: "Sinh nhật, cần nến"

    @Enumerated(EnumType.STRING)
    @Column(length = 15)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;
    // PENDING → CONFIRMED → ARRIVED hoặc CANCELLED

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private ReservationSource source = ReservationSource.STAFF;
    // STAFF = nhân viên đặt hộ | ONLINE = khách tự đặt qua web

    // Staff nào confirm đặt bàn này
    // Lưu UUID thay vì @ManyToOne — tránh lỗi vòng lặp JSON
    @Column(name = "confirmed_by")
    private UUID confirmedBy;  // null = chưa có ai confirm

    // Staff nào hủy đặt bàn này
    @Column(name = "cancelled_by")
    private UUID cancelledBy;  // null = chưa bị hủy

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;  // Lý do hủy nếu có

    @Column(name = "created_at", updatable = false)
    // updatable=false → cột này chỉ ghi 1 lần khi INSERT, không bao giờ UPDATE
    private OffsetDateTime createdAt;

    @PrePersist  // Chỉ chạy khi INSERT lần đầu
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    @Column(name = "table_id")
    private UUID tableId;  // null = chưa assign bàn
}
// THY - Entity: Reservation (Dat ban truoc)
// TODO: Implement Reservation entity
// @Entity @Table(name = "reservations")
// Fields:
//   - id             : UUID, PK
//   - customerName   : VARCHAR(100)
//   - customerPhone  : VARCHAR(15)
//   - partySize      : INT (> 0)
//   - reservedAt     : TIMESTAMPTZ
//   - note           : TEXT
//   - status         : VARCHAR(15) [pending|confirmed|arrived|cancelled]
//   - source         : VARCHAR(10) [online|staff]
//   - confirmedBy    : UUID, FK → users.id
//   - cancelledBy    : UUID, FK → users.id
//   - cancelReason   : TEXT
//   - createdAt      : TIMESTAMPTZ
//   - tableId        : UUID, FK → tables.id (null = chưa assign bàn)
// Annotations: @Enumerated for status & source