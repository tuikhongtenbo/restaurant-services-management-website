package com.restaurant.service.reservation.impl;

import com.restaurant.common.enums.ReservationSource;
import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import com.restaurant.dto.response.table.TableResponse;
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
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private static final int RESERVATION_DURATION_HOURS = 2;
    private static final int ASSIGN_BEFORE_MINUTES = 30;
    private static final int AUTO_CANCEL_MINUTES = 30;
    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<ReservationStatus> ACTIVE_STATUSES =
            Set.of(ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED);

    private final ReservationRepository reservationRepository;
    private final TableRepository tableRepository;

    private void releaseTable(Reservation reservation) {
        if (reservation.getTableId() == null) {
            return;
        }

        tableRepository.findById(reservation.getTableId())
                .ifPresent(table -> {
                    table.setStatus(TableStatus.EMPTY);
                    tableRepository.save(table);
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

    private TableResponse toTableResponse(Table table) {
        return TableResponse.builder()
                .id(table.getId())
                .number(table.getNumber())
                .capacity(table.getCapacity())
                .status(table.getStatus().name())
                .area(table.getArea())
                .isActive(table.getIsActive())
                .updatedAt(table.getUpdatedAt())
                .build();
    }

    private boolean hasCapacity(Integer partySize, OffsetDateTime wantedTime, UUID excludeReservationId) {
        List<Table> capableTables = tableRepository.findByIsActiveTrue()
                .stream()
                .filter(t -> t.getCapacity() >= partySize)
                .toList();

        if (capableTables.isEmpty()) {
            return false;
        }

        Set<UUID> capableTableIds = capableTables.stream()
                .map(Table::getId)
                .collect(Collectors.toSet());

        OffsetDateTime rangeStart = wantedTime.minusHours(RESERVATION_DURATION_HOURS);
        OffsetDateTime rangeEnd = wantedTime.plusHours(RESERVATION_DURATION_HOURS);

        long blockingReservations = reservationRepository.findByReservedAtBetween(rangeStart, rangeEnd)
                .stream()
                .filter(r -> excludeReservationId == null || !excludeReservationId.equals(r.getId()))
                .filter(r -> ACTIVE_STATUSES.contains(r.getStatus()))
                .filter(r -> {
                    if (r.getTableId() != null) {
                        return capableTableIds.contains(r.getTableId());
                    }
                    return r.getPartySize() >= partySize;
                })
                .count();

        return blockingReservations < capableTables.size();
    }

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

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public ReservationResponse createAndConfirm(CreateReservationRequest request, UUID staffId) {
        Reservation r = Reservation.builder()
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .partySize(request.getPartySize())
                .reservedAt(request.getReservedAt())
                .note(request.getNote())
                .source(staffId != null ? ReservationSource.STAFF : ReservationSource.ONLINE)
                .status(ReservationStatus.PENDING)
                .tableId(null)
                .build();

        if (!hasCapacity(request.getPartySize(), request.getReservedAt(), null)) {
            r.setStatus(ReservationStatus.CANCELLED);
            r.setCancelReason("Nha hang het ban phu hop trong khung gio nay");
            reservationRepository.save(r);
            throw new BusinessException("Nha hang da het ban phu hop cho " + request.getPartySize() + " nguoi vao khung gio nay.");
        }

        r.setStatus(ReservationStatus.CONFIRMED);
        r.setConfirmedBy(staffId);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse update(UUID id, UpdateReservationRequest request) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING && r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi cho phep sua dat ban o trang thai PENDING hoac CONFIRMED");
        }

        Integer newPartySize = request.getPartySize() != null ? request.getPartySize() : r.getPartySize();
        OffsetDateTime newReservedAt = request.getReservedAt() != null ? request.getReservedAt() : r.getReservedAt();

        if (!hasCapacity(newPartySize, newReservedAt, r.getId())) {
            throw new BusinessException("Khung gio moi khong con ban phu hop cho " + newPartySize + " nguoi.");
        }

        if (request.getCustomerName() != null) r.setCustomerName(request.getCustomerName());
        if (request.getCustomerPhone() != null) r.setCustomerPhone(request.getCustomerPhone());
        if (request.getPartySize() != null) r.setPartySize(request.getPartySize());
        if (request.getReservedAt() != null) r.setReservedAt(request.getReservedAt());
        if (request.getNote() != null) r.setNote(request.getNote());

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse arrived(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi cho phep check-in voi dat ban da CONFIRMED");
        }
        if (r.getTableId() == null) {
            throw new BusinessException("Dat ban nay chua duoc gan ban cu the.");
        }

        Table table = tableRepository.findById(r.getTableId())
                .orElseThrow(() -> new BusinessException("Khong tim thay ban da gan cho dat ban."));

        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);

        r.setStatus(ReservationStatus.ARRIVED);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse noShow(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chi danh dau NO_SHOW voi dat ban CONFIRMED");
        }

        releaseTable(r);
        r.setStatus(ReservationStatus.NO_SHOW);
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
        r.setCancelledBy(cancelledBy);
        r.setCancelReason(reason);
        return toResponse(reservationRepository.save(r));
    }

    @Scheduled(fixedRate = 60000)
    @Override
    public void autoAssignTables() {
        OffsetDateTime now = OffsetDateTime.now(RESTAURANT_ZONE);
        OffsetDateTime soon = now.plusMinutes(ASSIGN_BEFORE_MINUTES);

        List<Reservation> upcoming = reservationRepository.findUnassignedUpcoming(now, soon);

        upcoming.forEach(reservation -> tableRepository.findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                .stream()
                .filter(table -> table.getCapacity() >= reservation.getPartySize())
                .min((a, b) -> Integer.compare(
                        a.getCapacity() - reservation.getPartySize(),
                        b.getCapacity() - reservation.getPartySize()
                ))
                .ifPresent(table -> {
                    table.setStatus(TableStatus.RESERVED);
                    reservation.setTableId(table.getId());

                    reservationRepository.save(reservation);
                    tableRepository.save(table);
                }));
    }

    @Scheduled(fixedRate = 60000)
    @Override
    public void autoCancelExpired() {
        OffsetDateTime cutoff = OffsetDateTime.now(RESTAURANT_ZONE).minusMinutes(AUTO_CANCEL_MINUTES);

        List<Reservation> expired = reservationRepository
                .findByStatusAndReservedAtBefore(ReservationStatus.CONFIRMED, cutoff);

        expired.forEach(r -> {
            releaseTable(r);
            r.setStatus(ReservationStatus.CANCELLED);
            r.setCancelReason("He thong tu dong huy: qua " + AUTO_CANCEL_MINUTES + " phut so voi lich hen.");
            reservationRepository.save(r);
        });
    }

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
                .pending((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count())
                .confirmed((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .arrived((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.ARRIVED).count())
                .cancelled((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalDate> getAvailableDates() {
        LocalDate today = LocalDate.now(RESTAURANT_ZONE);
        return today.datesUntil(today.plusDays(30))
                .filter(date -> !getAvailableTimes(date, 1).isEmpty())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalTime> getAvailableTimes(LocalDate date, Integer partySize) {
        LocalTime open = LocalTime.of(10, 0);
        LocalTime close = LocalTime.of(21, 0);
        OffsetDateTime now = OffsetDateTime.now(RESTAURANT_ZONE);

        return Stream.iterate(open, time -> time.isBefore(close), time -> time.plusMinutes(30))
                .filter(time -> {
                    OffsetDateTime wantedTime = date.atTime(time).atZone(RESTAURANT_ZONE).toOffsetDateTime();
                    return wantedTime.isAfter(now) && hasCapacity(partySize, wantedTime, null);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalTime> getAvailableSlots(LocalDate date, Integer partySize) {
        return getAvailableTimes(date, partySize);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse suggestTable(Integer partySize) {
        return tableRepository.findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                .stream()
                .filter(table -> table.getCapacity() >= partySize)
                .min((a, b) -> Integer.compare(a.getCapacity() - partySize, b.getCapacity() - partySize))
                .map(this::toTableResponse)
                .orElseThrow(() -> new BusinessException("Khong co ban trong phu hop"));
    }

    @Override
    public void delete(UUID id) {
        Reservation reservation = findOrThrow(id);
        releaseTable(reservation);
        reservationRepository.delete(reservation);
    }
}
