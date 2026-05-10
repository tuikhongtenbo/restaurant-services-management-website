package com.restaurant.repository;

// THY
// TODO: JpaRepository<Reservation, UUID>
// Custom queries:
//   - List<Reservation> findByReservedAtBetween(LocalDateTime from, LocalDateTime to)
//   - List<Reservation> findByStatus(ReservationStatus status)
//   - List<Reservation> findByCustomerPhone(String phone)
//   - List<Reservation> findByReservedAtBetweenAndStatus(LocalDateTime from, LocalDateTime to, ReservationStatus status)
//   - @Query: tim cac reservation con pending sau 30 phut (auto-cancel)

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    // Lấy tất cả đặt bàn theo trạng thái
    List<Reservation> findByStatus(ReservationStatus status);

    // Lấy đặt bàn trong 1 ngày cụ thể
    // BETWEEN start AND end → tìm trong khoảng thời gian
    List<Reservation> findByReservedAtBetween(
            OffsetDateTime start,
            OffsetDateTime end
    );

    // Lấy đặt bàn theo SĐT khách — STAFF tìm kiếm
    List<Reservation> findByCustomerPhone(String phone);

    // Custom query phức tạp hơn → dùng @Query viết JPQL
    // JPQL giống SQL nhưng dùng tên Entity và field Java, không phải tên bảng DB
    @Query("""
        SELECT r FROM Reservation r
        WHERE r.reservedAt BETWEEN :start AND :end
        AND r.status NOT IN ('CANCELLED', 'NO_SHOW')
        ORDER BY r.reservedAt ASC
        """)
    List<Reservation> findActiveReservationsBetween(
            @Param("start") OffsetDateTime start,  // @Param khớp với :start trong query
            @Param("end") OffsetDateTime end
    );

    // Kiểm tra trùng giờ đặt bàn — dùng cho thuật toán gợi ý bàn
    @Query("""
        SELECT COUNT(r) > 0 FROM Reservation r
        WHERE r.status IN ('PENDING', 'CONFIRMED')
        AND r.reservedAt BETWEEN :start AND :end
        """)
    boolean existsConflictingReservation(
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );
}