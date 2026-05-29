package com.restaurant.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;  // Dùng BigDecimal cho tiền — KHÔNG dùng double
import java.time.LocalDateTime;   // Giờ trong ngày: 17:00, 21:00
import java.time.OffsetDateTime;
import java.util.UUID;

import com.restaurant.common.enums.MenuItemStatus;

@Entity
@jakarta.persistence.Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 50)
    private String category;  // "Khai vị", "Món chính", "Tráng miệng"

    @Column(nullable = false, length = 100)
    private String name;  

    @Column(columnDefinition = "TEXT")
    private String description;  // Mô tả món

    @Column(name = "image_url", length = 500)
    private String imageUrl;  // Link ảnh món ăn

    @Column(nullable = false, precision = 12, scale = 0)
    // precision=12 → tổng 12 chữ số
    // scale=0      → không có phần thập phân (VNĐ không dùng xu)
    private BigDecimal price;  // Giá gốc: 150000

    @Column(name = "promo_price", precision = 12, scale = 0)
    private BigDecimal promoPrice = null;  // Giá KM: 120000 — null = không KM

    @Column(name = "promo_start")
    private LocalDateTime promoStart = null;

    @Column(name = "promo_end")
    private LocalDateTime promoEnd = null;

    @Column(columnDefinition = "TEXT")
    private String tags = null;  // "spicy,popular,new" — tìm kiếm dễ hơn

    @Enumerated(EnumType.STRING)
    @Column(length = 15)
    @Builder.Default
    private MenuItemStatus status = MenuItemStatus.AVAILABLE;
    // AVAILABLE | OUT_OF_STOCK | HIDDEN

    @Column(name = "sort_order")
    private Integer sortOrder ;  // Thứ tự hiển thị trong menu

    // Staff nào cập nhật món này lần cuối
    @Column(name = "updated_by")
    private UUID updatedBy = null;  // Lưu UUID như teammate làm với createdBy

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
// THY - Entity: MenuItem (Thuc don)
// TODO: Implement MenuItem entity
// @Entity @Table(name = "menu_items")
// Fields:
//   - id          : UUID, PK
//   - category    : VARCHAR(50) (Khai_vi|Mon_chinh|Trang_mieng|Do_uong)
//   - name        : VARCHAR(100)
//   - description : TEXT
//   - imageUrl    : VARCHAR(500)
//   - price       : DECIMAL(12,0)
//   - promoPrice  : DECIMAL(12,0) (nullable)
//   - promoStart  : TIME (nullable)
//   - promoEnd    : TIME (nullable)
//   - tags        : VARCHAR(255) [Ban_chay|Moi|Chay|Cay|Dac_san]
//   - status      : VARCHAR(15) [available|out_of_stock|hidden]
//   - sortOrder   : INT
//   - updatedBy   : UUID, FK → users.id
//   - createdAt   : TIMESTAMPTZ
//   - updatedAt   : TIMESTAMPTZ
// Annotations: @Enumerated for status
