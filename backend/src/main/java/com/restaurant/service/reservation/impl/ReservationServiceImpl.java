package com.restaurant.service.reservation.impl;

import com.restaurant.common.enums.ReservationSource;
import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.BookingSuggestionResponse;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.model.Reservation;
import com.restaurant.model.Table;
import com.restaurant.repository.ReservationRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.reservation.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    // ------------------------------------------------------------------ constants

    private static final int       RESERVATION_DURATION_HOURS = 3;
    private static final int       ASSIGN_BEFORE_MINUTES      = 30;
    private static final int       AUTO_CANCEL_MINUTES        = 30;
    private static final int       SLOT_INTERVAL_MINUTES      = 30;
    private static final int       BOOKING_HORIZON_DAYS       = 30;
    private static final LocalTime OPEN_TIME                  = LocalTime.of(10, 0);
    private static final LocalTime CLOSE_TIME                 = LocalTime.of(21, 0);
    private static final ZoneId    RESTAURANT_ZONE            = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Trạng thái "đang chiếm slot" — dùng thống nhất ở mọi chỗ.
     * PENDING không block vì chưa confirmed.
     */
    private static final Set<ReservationStatus> BLOCKING_STATUSES =
            Set.of(ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED);

    // ------------------------------------------------------------------ dependencies

    private final ReservationRepository reservationRepository;
    private final TableRepository       tableRepository;

    // ================================================================== private helpers

    /**
     * Kiểm tra nhà hàng còn đủ capacity cho partySize vào wantedTime không.
     *
     * Logic:
     *   - Lấy tất cả bàn active có capacity >= partySize → capableTables
     *   - Đếm số reservation BLOCKING trong cửa sổ ±RESERVATION_DURATION_HOURS:
     *       + Đã gán bàn: chỉ tính nếu bàn đó thuộc capableTables
     *       + Chưa gán bàn: vẫn tính là chiếm 1 bàn (đã CONFIRMED, chắc chắn sẽ được gán)
     *   - Nếu số reservation blocking < số bàn capable → còn chỗ
     */
    /**
     * Kiểm tra còn bàn phù hợp cho partySize vào wantedTime không.
     *
     * Thuật toán simulate gán bàn:
     *   1. Pool = tất cả bàn active.
     *   2. Reservation BLOCKING đã có tableId → xoá bàn đó khỏi pool.
     *   3. Reservation BLOCKING chưa có tableId → greedy assign bàn nhỏ nhất vừa đủ
     *      trong pool (sắp xếp partySize tăng dần để bàn nhỏ fill trước, tránh lãng phí bàn lớn).
     *   4. Pool còn bàn nào capacity >= partySize mới → còn chỗ.
     */
    private boolean hasCapacity(Integer partySize, OffsetDateTime wantedTime, UUID excludeReservationId) {
        List<Table> allTables = tableRepository.findByIsActiveTrueAndDeletedAtIsNull();
        if (allTables.isEmpty()) return false;

        List<Reservation> blocking = reservationRepository
                .findByReservedAtBetween(
                        wantedTime.minusHours(RESERVATION_DURATION_HOURS),
                        wantedTime.plusHours(RESERVATION_DURATION_HOURS)
                )
                .stream()
                .filter(r -> excludeReservationId == null || !excludeReservationId.equals(r.getId()))
                .filter(r -> BLOCKING_STATUSES.contains(r.getStatus()))
                .toList();

        // Step 1: xoá bàn đã được gán cụ thể
        Set<UUID> assignedTableIds = blocking.stream()
                .filter(r -> r.getTableId() != null)
                .map(Reservation::getTableId)
                .collect(Collectors.toSet());

        List<Table> availablePool = allTables.stream()
                .filter(t -> !assignedTableIds.contains(t.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        // Step 2: simulate gán bàn cho reservation chưa có tableId
        // Sắp xếp partySize tăng dần → bàn nhỏ được fill trước, tránh lãng phí bàn lớn
        blocking.stream()
                .filter(r -> r.getTableId() == null)
                .sorted(Comparator.comparingInt(Reservation::getPartySize))
                .forEach(r ->
                    availablePool.stream()
                            .filter(t -> t.getCapacity() >= r.getPartySize())
                            .min(Comparator.comparingInt(Table::getCapacity))
                            .ifPresent(availablePool::remove)
                );

        // Step 3: còn bàn nào chứa được partySize mới không
        return availablePool.stream().anyMatch(t -> t.getCapacity() >= partySize);
    }

    /**
     * Validate thời gian đặt bàn:
     *   1. Không được trong quá khứ.
     *   2. Phải nằm trong giờ mở cửa (OPEN_TIME → CLOSE_TIME).
     */
    private void validateReservationTime(OffsetDateTime reservedAt) {
        OffsetDateTime now = OffsetDateTime.now(RESTAURANT_ZONE);

        if (!reservedAt.isAfter(now)) {
            throw new BusinessException("Thoi gian dat ban khong duoc la qua khu.");
        }

        LocalTime time = reservedAt.atZoneSameInstant(RESTAURANT_ZONE).toLocalTime();
        if (time.isBefore(OPEN_TIME) || time.isAfter(CLOSE_TIME)) {
            throw new BusinessException(
                    "Thoi gian dat ban phai trong gio hoat dong ("
                    + OPEN_TIME + " - " + CLOSE_TIME + ")."
            );
        }
    }

    private void releaseTable(Reservation reservation) {
        if (reservation.getTableId() == null) return;

        tableRepository.findById(reservation.getTableId())
                .ifPresent(table -> {
                    if (table.getStatus() == TableStatus.RESERVED) {
                        table.setStatus(TableStatus.EMPTY);
                        tableRepository.save(table);
                    }
                });
        reservation.setTableId(null);
        reservationRepository.save(reservation);
    }

    private OffsetDateTime toStartOfDay(LocalDate date) {
        return date.atStartOfDay(RESTAURANT_ZONE).toOffsetDateTime();
    }

    private Reservation findOrThrow(UUID id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Khong tim thay thong tin dat ban: " + id));
    }

    private ReservationResponse toResponse(Reservation r) {
        return ReservationResponse.builder()
                .id(r.getId())
                .customerName(r.getCustomerName())
                .customerPhone(r.getCustomerPhone())
                .partySize(r.getPartySize())
                .reservedAt(r.getReservedAt())
                .note(r.getNote())
                .status(r.getStatus().name())
                .source(r.getSource().name())
                .tableId(r.getTableId())
                .confirmedBy(r.getConfirmedBy())
                .cancelledBy(r.getCancelledBy())
                .cancelReason(r.getCancelReason())
                .createdAt(r.getCreatedAt())
                .build();
    }

    // ================================================================== public API

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservations(LocalDate date, ReservationStatus status, Pageable pageable) {
        if (date != null && status != null) {
            OffsetDateTime start = toStartOfDay(date);
            return reservationRepository
                    .findByReservedAtBetweenAndStatus(start, start.plusDays(1), status, pageable)
                    .map(this::toResponse);
        }
        if (date != null) {
            OffsetDateTime start = toStartOfDay(date);
            return reservationRepository
                    .findByReservedAtBetweenOrderByReservedAtAsc(start, start.plusDays(1), pageable)
                    .map(this::toResponse);
        }
        if (status != null) {
            return reservationRepository.findByStatus(status, pageable).map(this::toResponse);
        }
        return reservationRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    // ------------------------------------------------------------------ create / confirm

    /** Tạo reservation ở trạng thái PENDING. Chỉ validate thời gian; capacity check ở bước confirm. */
    @Override
    public ReservationResponse createReservation(CreateReservationRequest request, UUID staffId) {
        validateReservationTime(request.getReservedAt());

        Reservation reservation = Reservation.builder()
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .partySize(request.getPartySize())
                .reservedAt(request.getReservedAt())
                .note(request.getNote())
                .source(staffId != null ? ReservationSource.STAFF : ReservationSource.ONLINE)
                .status(ReservationStatus.PENDING)
                .tableId(null)
                .build();

        return toResponse(reservationRepository.save(reservation));
    }

    /**
     * Confirm một reservation PENDING.
     *
     * Kiểm tra theo thứ tự:
     *   1. Trạng thái phải là PENDING.
     *   2. Giờ đặt không được là quá khứ / ngoài giờ mở cửa.
     *   3. Nhà hàng còn đủ capacity cho partySize trong khung giờ đó.
     *
     * Nếu không đủ capacity → tự động CANCELLED và ném BusinessException.
     */
    @Override
    public ReservationResponse confirmReservation(UUID id, UUID tableId, UUID staffId) {
        Reservation reservation = findOrThrow(id);

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessException("Chi cho phep confirm reservation dang PENDING.");
        }

        validateReservationTime(reservation.getReservedAt());

        Table table = tableRepository.findById(tableId)
                .orElseThrow(() -> new BusinessException("Ban khong ton tai."));

        if (!table.getIsActive() || table.getStatus() != TableStatus.EMPTY) {
            throw new BusinessException("Ban nay khong con trong hoac khong hoat dong.");
        }

        if (table.getCapacity() < reservation.getPartySize()) {
            throw new BusinessException("Suc chua cua ban khong du cho so luong khach.");
        }

        reservation.setTableId(tableId);
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setConfirmedBy(staffId);
        
        table.setStatus(TableStatus.RESERVED);
        tableRepository.save(table);

        return toResponse(reservationRepository.save(reservation));
    }

    // ------------------------------------------------------------------ update / lifecycle

    @Override
    public ReservationResponse update(UUID id, UpdateReservationRequest request) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING && r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi cho phep sua dat ban o trang thai PENDING hoac CONFIRMED.");
        }

        Integer        newPartySize  = request.getPartySize()  != null ? request.getPartySize()  : r.getPartySize();
        OffsetDateTime newReservedAt = request.getReservedAt() != null ? request.getReservedAt() : r.getReservedAt();

        validateReservationTime(newReservedAt);

        if (!hasCapacity(newPartySize, newReservedAt, r.getId())) {
            throw new BusinessException("Khung gio moi khong con du cho " + newPartySize + " nguoi.");
        }

        if (request.getCustomerName()  != null) r.setCustomerName(request.getCustomerName());
        if (request.getCustomerPhone() != null) r.setCustomerPhone(request.getCustomerPhone());
        if (request.getPartySize()     != null) r.setPartySize(request.getPartySize());
        if (request.getReservedAt()    != null) r.setReservedAt(request.getReservedAt());
        if (request.getNote()          != null) r.setNote(request.getNote());

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse arrived(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi cho phep check-in voi dat ban da CONFIRMED.");
        }
        if (r.getTableId() == null) {
            throw new BusinessException("Dat ban nay chua duoc gan ban cu the.");
        }

        Table table = tableRepository.findById(r.getTableId())
                .orElseThrow(() -> new BusinessException("Khong tim thay ban da gan cho dat ban."));

        if (!OffsetDateTime.now(RESTAURANT_ZONE).toLocalDate().equals(r.getReservedAt().toLocalDate())) {
            throw new BusinessException("Chỉ được check-in vào đúng ngày khách đã đặt bàn.");
        }

        // Cập nhật trạng thái bàn sang SERVING
        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);

        r.setStatus(ReservationStatus.ARRIVED);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse cancel(UUID id, UUID cancelledBy, String reason) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() == ReservationStatus.ARRIVED) {
            throw new BusinessException("Khach da den va dang dung bua, khong the huy.");
        }
        if (r.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Dat ban nay da duoc huy truoc do.");
        }

        releaseTable(r);
        r.setStatus(ReservationStatus.CANCELLED);
        if (cancelledBy != null) {
            r.setCancelledBy(cancelledBy);
        }
        r.setCancelReason(reason);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse reject(UUID id, UUID staffId, String reason) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessException("Chi cho phep tu choi dat ban dang PENDING.");
        }

        releaseTable(r);
        r.setStatus(ReservationStatus.REJECTED);
        r.setCancelledBy(staffId);
        r.setCancelReason(reason);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public void delete(UUID id) {
        Reservation reservation = findOrThrow(id);
        releaseTable(reservation);
        reservationRepository.delete(reservation);
    }

    // ------------------------------------------------------------------ scheduled jobs

    @Scheduled(fixedRate = 60_000)
    @Override
    public void autoAssignTables() {
        OffsetDateTime now  = OffsetDateTime.now(RESTAURANT_ZONE);
        OffsetDateTime soon = now.plusMinutes(ASSIGN_BEFORE_MINUTES);

        reservationRepository.findUnassignedUpcoming(now, soon).forEach(reservation ->
            tableRepository.findAll().stream()
                    .filter(Table::getIsActive)
                    .filter(t -> t.getStatus() == TableStatus.EMPTY)
                    .filter(t -> t.getCapacity() >= reservation.getPartySize())
                    .min(Comparator.comparingInt(t -> t.getCapacity() - reservation.getPartySize()))
                    .ifPresent(table -> {
                        table.setStatus(TableStatus.RESERVED);
                        reservation.setTableId(table.getId());
                        reservationRepository.save(reservation);
                        tableRepository.save(table);
                    })
        );

        reservationRepository.findAssignedUpcoming(now, soon).forEach(reservation -> {
            tableRepository.findById(reservation.getTableId()).ifPresent(table -> {
                if (table.getIsActive() && table.getStatus() != TableStatus.RESERVED) {
                    table.setStatus(TableStatus.RESERVED);
                    tableRepository.save(table);
                }
            });
        });
    }

    @Scheduled(fixedRate = 60_000)
    @Override
    public void autoNoShowExpired() {
        OffsetDateTime cutoff = OffsetDateTime.now(RESTAURANT_ZONE).minusMinutes(30);

        reservationRepository
                .findByStatusAndReservedAtBefore(ReservationStatus.CONFIRMED, cutoff)
                .forEach(r -> {
                    releaseTable(r);
                    r.setStatus(ReservationStatus.NO_SHOW);
                    r.setCancelReason("He thong tu dong: Khach khong den sau 30 phut.");
                    reservationRepository.save(r);
                });
    }

    // ------------------------------------------------------------------ calendar

    @Override
    @Transactional(readOnly = true)
    public ReservationCalendarResponse getCalendar(LocalDate date) {
        OffsetDateTime start = toStartOfDay(date);
        List<Reservation> all = reservationRepository
                .findByReservedAtBetweenOrderByReservedAtAsc(start, start.plusDays(1));

        return ReservationCalendarResponse.builder()
                .date(date)
                .reservations(all.stream().map(this::toResponse).toList())
                .totalReservations(all.size())
                .pending  ((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING  ).count())
                .confirmed((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .arrived  ((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.ARRIVED  ).count())
                .cancelled((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .build();
    }

    // ------------------------------------------------------------------ booking suggestion

    /**
     * Gợi ý lịch đặt bàn dựa theo các ngày khách rảnh.
     *
     * Khách cung cấp:
     *   - preferredDates : danh sách ngày khách có thể đến
     *   - partySize      : số người
     *
     * Kết quả: mỗi ngày còn slot trống được trả về kèm danh sách giờ có thể đặt.
     * Ngày nào không còn slot nào phù hợp sẽ bị loại khỏi kết quả.
     *
     * Slot được tính bằng hasCapacity() — chỉ kiểm tra capacity tổng,
     * không gắn bàn cụ thể ở bước này.
     */
    @Override
    @Transactional(readOnly = true)
    public List<BookingSuggestionResponse> suggestBookingSlots(List<LocalDate> preferredDates,
                                                               Integer partySize) {
        LocalDate      today   = LocalDate.now(RESTAURANT_ZONE);
        LocalDate      horizon = today.plusDays(BOOKING_HORIZON_DAYS);
        OffsetDateTime now     = OffsetDateTime.now(RESTAURANT_ZONE);

        return preferredDates.stream()
                .filter(date -> !date.isBefore(today) && date.isBefore(horizon))
                .sorted()
                .map(date -> {
                    // Slot cuối phải kết thúc trước CLOSE_TIME → start tối đa CLOSE_TIME - duration
                    LocalTime lastSlot = CLOSE_TIME.minusHours(RESERVATION_DURATION_HOURS);

                    List<LocalTime> slots = Stream
                            .iterate(OPEN_TIME,
                                     time -> !time.isAfter(lastSlot),
                                     time -> time.plusMinutes(SLOT_INTERVAL_MINUTES))
                            .map(time -> date.atTime(time).atZone(RESTAURANT_ZONE).toOffsetDateTime())
                            .filter(wantedTime -> wantedTime.isAfter(now))
                            .filter(wantedTime -> hasCapacity(partySize, wantedTime, null))
                            .map(wantedTime -> wantedTime.atZoneSameInstant(RESTAURANT_ZONE).toLocalTime())
                            .toList();

                    return BookingSuggestionResponse.builder()
                            .date(date)
                            .partySize(partySize)
                            .availableSlots(slots)
                            .build();
                })
                .filter(r -> !r.getAvailableSlots().isEmpty())
                .toList();
    }
}