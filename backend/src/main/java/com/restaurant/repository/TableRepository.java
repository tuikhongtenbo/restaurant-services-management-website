package com.restaurant.repository;

// THY
// TODO: JpaRepository<Table, UUID>
// Custom queries:
//   - Optional<Table> findByNumber(String number)
//   - boolean existsByNumber(String number)
//   - List<Table> findByArea(String area)
//   - List<Table> findByStatus(TableStatus status)
//   - List<Table> findByAreaAndStatus(String area, TableStatus status)
//   - List<Table> findByIsActiveTrue()

import com.restaurant.common.enums.TableStatus;
import com.restaurant.model.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository  // Báo Spring: đây là Repository — được quản lý bởi Spring
public interface TableRepository extends JpaRepository<Table, UUID> {
    // JpaRepository<Entity, KiểuIdCủaEntity>
    // Kế thừa sẵn: save() findById() findAll() deleteById() existsById()

    // Đặt tên đúng quy tắc → Spring tự tạo SQL, không cần viết body
    // findBy + Status → SELECT * FROM tables WHERE status = ?
    List<Table> findByStatus(TableStatus status);

    // findBy + IsActive → SELECT * FROM tables WHERE is_active = ?
    List<Table> findByIsActive(Boolean isActive);

    // findBy + IsActive + Status → WHERE is_active=? AND status=?
    List<Table> findByIsActiveAndStatus(Boolean isActive, TableStatus status);

    // Kiểm tra bàn có tồn tại với số bàn đó không (tránh trùng)
    // existsBy + Number → SELECT COUNT(*) > 0 WHERE number = ?
    boolean existsByNumber(String number);

    boolean existsByTableIdAndStatus(UUID tableId, TableStatus status); 

    List<Table> findByIsActiveTrue();

    List<Table> findByIsActiveTrueAndStatus(TableStatus status);
}