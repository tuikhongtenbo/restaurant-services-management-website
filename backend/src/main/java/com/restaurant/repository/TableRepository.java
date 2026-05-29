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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TableRepository extends JpaRepository<Table, UUID> {

    // Kiểm tra trùng số bàn ăn khi thêm mới hoặc cập nhật
    boolean existsByNumber(String number);

    // Lấy danh sách bàn đang hoạt động phục vụ cho sơ đồ mặt bằng Layout
    List<Table> findByIsActiveTrue();

    Page<Table> findByIsActiveTrue(Pageable pageable);

    // HỖ TRỢ FILTER THEO TRẠNG THÁI: Tìm kiếm phân trang bàn theo trạng thái (status)
    Page<Table> findByIsActiveTrueAndStatus(TableStatus status, Pageable pageable);

    Page<Table> findByIsActiveTrueAndAreaAndStatus(String area, TableStatus status, Pageable pageable);

    Page<Table> findByIsActiveTrueAndArea(String area, Pageable pageable);

    // Lấy danh sách bàn trống để tìm kiếm bàn phù hợp với sức chứa
    List<Table> findByIsActiveTrueAndStatus(TableStatus status);
}
