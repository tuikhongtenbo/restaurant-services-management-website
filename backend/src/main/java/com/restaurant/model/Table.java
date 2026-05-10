package com.restaurant.model;

// jakarta.persistence = thư viện JPA để map với database
import jakarta.persistence.*;
// lombok = tự sinh getter/setter/constructor
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

// Enum trạng thái bàn 
import com.restaurant.common.enums.TableStatus;

@Entity                              // Báo Spring: class này map với 1 bảng DB
@jakarta.persistence.Table(name = "tables")  // Tên bảng trong PostgreSQL là "tables"
@Getter                              // Lombok: tự tạo tất cả getter
@Setter                              // Lombok: tự tạo tất cả setter
@NoArgsConstructor                   // Lombok: tạo constructor không tham số — JPA bắt buộc cần
@AllArgsConstructor                  // Lombok: tạo constructor đủ tất cả tham số
@Builder                             // Lombok: cho phép dùng Table.builder().build()
public class Table {

    @Id                                              // Đây là primary key
    @GeneratedValue(strategy = GenerationType.UUID)  // Tự tạo UUID, không cần truyền vào
    private UUID id;

    @Column(name = "number", length = 10, unique = true)
    // name="number"  → tên cột trong DB là "number"
    // length=10      → varchar(10)
    // unique=true    → không được trùng số bàn
    private String number;  

    @Column(nullable = false)
    // nullable=false → NOT NULL trong DB, bắt buộc phải có
    private Integer capacity;  // Sức chứa: 2, 4, 6, 8...

    @Enumerated(EnumType.STRING)   // Lưu text "EMPTY" vào DB thay vì số 0,1,2
    @Column(length = 10)
    @Builder.Default               // Giữ giá trị default khi dùng Builder
    private TableStatus status = TableStatus.EMPTY;  // Mặc định: bàn trống

    @Column(name = "area", length = 50)
    private String area;  // Vị trí bàn: Tang_1, Tang_2, San_vuon, Phong_VIP

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;  // Mặc định: bàn đang hoạt động

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;  // Thời gian cập nhật lần cuối

    // Tự động chạy trước khi INSERT hoặc UPDATE
    @PrePersist   // Chạy lần đầu khi lưu vào DB
    @PreUpdate    // Chạy mỗi khi cập nhật
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();  // Gán thời gian hiện tại
    }
}
// THY - Entity: Table (Quan ly ban)
// TODO: Implement Table entity
// @Entity @Table(name = "tables")
// Fields:
//   - id       : UUID, PK
//   - number   : VARCHAR(10), UNIQUE
//   - capacity : INT (> 0)
//   - status   : VARCHAR(10) [empty|serving|cleaning]
//   - area     : VARCHAR(50) [Tang_1|Tang_2|San_vuon|Phong_VIP]
//   - isActive : BOOLEAN DEFAULT TRUE
//   - updatedAt: TIMESTAMPTZ
// Annotations: @Enumerated for status