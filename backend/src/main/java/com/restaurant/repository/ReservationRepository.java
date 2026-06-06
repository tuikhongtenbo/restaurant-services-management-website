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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

        // Lấy tất cả đặt bàn theo trạng thái
        Page<Reservation> findByStatus(ReservationStatus status, Pageable pageable);
        List<Reservation> findByStatus(ReservationStatus status);    

        // Lấy đặt bàn trong 1 ngày cụ thể
        // BETWEEN start AND end → tìm trong khoảng thời gian
        Page<Reservation> findByReservedAtBetween(
                OffsetDateTime start,
                OffsetDateTime end,
                Pageable pageable
        );
        List<Reservation> findByReservedAtBetween(
                OffsetDateTime start,
                OffsetDateTime end
        );

        Page<Reservation> findByReservedAtBetweenAndStatus(
                OffsetDateTime start,
                OffsetDateTime end,
                ReservationStatus status,
                Pageable pageable
        );
        List<Reservation> findByReservedAtBetweenAndStatus(
                OffsetDateTime start,
                OffsetDateTime end,
                ReservationStatus status
        );

        Page<Reservation> findByStatusAndReservedAtBefore(
                ReservationStatus status,
                OffsetDateTime cutoff,
                Pageable pageable
        );
        List<Reservation> findByStatusAndReservedAtBefore(
                ReservationStatus status,
                OffsetDateTime cutoff
        );

        Page<Reservation> findByReservedAtBetweenOrderByReservedAtAsc(
                OffsetDateTime start,
                OffsetDateTime end, 
                Pageable pageable
        );
        List<Reservation> findByReservedAtBetweenOrderByReservedAtAsc(
                OffsetDateTime start,
                OffsetDateTime end
        );                      

        // Lấy đặt bàn theo SĐT khách — STAFF tìm kiếm
        Page<Reservation> findByCustomerPhone(String phone, Pageable pageable);
        List<Reservation> findByCustomerPhone(String phone);

        @Query("SELECT COUNT(r) FROM Reservation r WHERE r.status IN :statuses AND r.reservedAt BETWEEN :start AND :end")
        long countByStatusInAndReservedAtBetween(
                @Param("statuses") List<ReservationStatus> statuses,
                @Param("start") OffsetDateTime start,
                @Param("end") OffsetDateTime end
        );

        @Query("SELECT r FROM Reservation r WHERE r.status = 'CONFIRMED' AND r.tableId IS NULL AND r.reservedAt BETWEEN :start AND :end")
        Page<Reservation> findUnassignedUpcoming(
                @Param("start") OffsetDateTime start,
                @Param("end") OffsetDateTime end,
                Pageable pageable
        );
        @Query("SELECT r FROM Reservation r WHERE r.status = 'CONFIRMED' AND r.tableId IS NULL AND r.reservedAt BETWEEN :start AND :end")
        List<Reservation> findUnassignedUpcoming(
                @Param("start") OffsetDateTime start,
                @Param("end") OffsetDateTime end
        );

        boolean existsByTableIdAndStatus(UUID tableId, ReservationStatus status);
}
