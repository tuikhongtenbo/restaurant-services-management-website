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

    List<Reservation> findByReservedAtBetweenAndStatus(
            OffsetDateTime start,
            OffsetDateTime end,
            ReservationStatus status,
            Pageable pageable
    );

    long countByStatusInAndReservedAtBetween(
            OffsetDateTime start,
            OffsetDateTime end,
            ReservationStatus status
    );

    List<Reservation> findByStatusAndReservedAtBefore(
            ReservationStatus status,
            OffsetDateTime cutoff
    );

    List<Reservation> findByReservedAtBetweenOrderByReservedAtAsc(
            OffsetDateTime start,
            OffsetDateTime end
    );

    // Lấy đặt bàn theo SĐT khách — STAFF tìm kiếm
    List<Reservation> findByCustomerPhone(String phone);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.status IN :statuses AND r.reservedAt BETWEEN :start AND :end")
    long countByStatusInAndReservedAtBetween(
            @Param("statuses") List<ReservationStatus> statuses,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );

    @Query("SELECT r FROM Reservation r WHERE r.status = 'CONFIRMED' AND r.tableId IS NULL AND r.reservedAt BETWEEN :start AND :end")
    List<Reservation> findUnassignedUpcoming(
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );

}