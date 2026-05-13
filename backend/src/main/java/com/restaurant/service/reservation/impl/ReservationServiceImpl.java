package com.restaurant.service.impl;

import com.restaurant.common.enums.ReservationSource;
import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exception.BusinessException;
import com.restaurant.dto.request.CreateReservationRequest;
import com.restaurant.dto.request.UpdateReservationRequest;
import com.restaurant.dto.response.*;
import com.restaurant.model.Reservation;
import com.restaurant.repository.ReservationRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final TableRepository tableRepository;

    // Bàn được giữ trước bao nhiêu phút
    private static final int ASSIGN_BEFORE_MINUTES = 30;
    // Tự động hủy sau bao nhiêu phút quá giờ
    private static final int AUTO_CANCEL_MINUTES = 30;
    // Mỗi lần đặt bàn chiếm bao nhiêu giờ
    private static final int RESERVATION_DURATION_HOURS = 2;


    // PRIVATE HELPERS 
    // Release bàn về EMPTY khi cancel/noShow
    private void releaseTable(Reservation reservation) {
        if (reservation.getTableId() != null) {
            tableRepository.findById(reservation.getTableId())
                    .ifPresent(table -> table.setStatus(TableStatus.EMPTY));
            reservation.setTableId(null);
        }
    }

    private OffsetDateTime toStartOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
    }

    private Reservation findOrThrow(UUID id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đặt bàn: " + id));
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
                .tableId(r.getTableId())  // cho client biết bàn nào đã được assign
                .createdAt(r.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservations(
            LocalDate date, ReservationStatus status, Pageable pageable) {

        if (date != null && status != null) {
            OffsetDateTime start = toStartOfDay(date);
            OffsetDateTime end   = start.plusDays(1);
            return reservationRepository
                    .findByReservedAtBetweenAndStatus(start, end, status, pageable)
                    .map(this::toResponse);
        }
        if (date != null) {
            OffsetDateTime start = toStartOfDay(date);
            return reservationRepository
                    .findByReservedAtBetween(start, start.plusDays(1), pageable)
                    .map(this::toResponse);
        }
        if (status != null) {
            return reservationRepository
                    .findByStatus(status, pageable)
                    .map(this::toResponse);
        }
        return reservationRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public ReservationResponse create(CreateReservationRequest request, UUID staffId) {

        // Kiểm tra trong khoảng ±2 tiếng có bàn trống không
        OffsetDateTime wantedTime = request.getReservedAt();
        OffsetDateTime rangeStart = wantedTime.minusHours(RESERVATION_DURATION_HOURS);
        OffsetDateTime rangeEnd   = wantedTime.plusHours(RESERVATION_DURATION_HOURS);

        // Đếm bàn đủ sức chứa
        long totalCapable = tableRepository
                .findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                .stream()
                .filter(t -> t.getCapacity() >= request.getPartySize())
                .count();

        // Đếm reservation đã book trong khung giờ đó
        long alreadyBooked = reservationRepository
                .countByStatusInAndReservedAtBetween(
                    List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                    rangeStart, rangeEnd
                );

        if (alreadyBooked >= totalCapable) {
            throw new BusinessException(
                "Không còn bàn trống cho " + request.getPartySize()
                + " người vào lúc " + wantedTime
            );
        }

        // Tạo reservation — tableId = null, chưa assign bàn
        Reservation reservation = Reservation.builder()
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .partySize(request.getPartySize())
                .reservedAt(request.getReservedAt())
                .note(request.getNote())
                .source(ReservationSource.STAFF)
                .status(ReservationStatus.PENDING)
                .tableId(null)  // chưa assign — scheduler sẽ làm sau
                .build();

        return toResponse(reservationRepository.save(reservation));
    }

    @Override
    public ReservationResponse update(UUID id, UpdateReservationRequest request) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessException("Chỉ sửa được đặt bàn đang PENDING");
        }

        if (request.getCustomerName()  != null) r.setCustomerName(request.getCustomerName());
        if (request.getCustomerPhone() != null) r.setCustomerPhone(request.getCustomerPhone());
        if (request.getPartySize()     != null) r.setPartySize(request.getPartySize());
        if (request.getReservedAt()    != null) r.setReservedAt(request.getReservedAt());
        if (request.getNote()          != null) r.setNote(request.getNote());

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse confirm(UUID id, UUID confirmedBy) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessException(
                "Chỉ confirm được PENDING, hiện tại: " + r.getStatus()
            );
        }

        r.setStatus(ReservationStatus.CONFIRMED);
        r.setConfirmedBy(confirmedBy);

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse arrived(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chỉ check-in được CONFIRMED");
        }

        // Bàn đã được assign trước đó bởi scheduler chưa?
        if (r.getTableId() == null) {
            throw new BusinessException("Chưa có bàn được assign cho reservation này");
        }

        // Đổi bàn từ RESERVED → SERVING
        tableRepository.findById(r.getTableId()).ifPresent(table -> {
            table.setStatus(TableStatus.SERVING);
        });

        r.setStatus(ReservationStatus.ARRIVED);
        tableRepository.save(table);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse noShow(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chỉ đánh dấu NO_SHOW được CONFIRMED");
        }

        // Release bàn về EMPTY
        releaseTable(r);

        r.setStatus(ReservationStatus.NO_SHOW);

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse cancel(UUID id, UUID cancelledBy, String reason) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() == ReservationStatus.ARRIVED) {
            throw new BusinessException("Không thể hủy khi khách đã đến");
        }
        if (r.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Đặt bàn đã bị hủy rồi");
        }

        // Nếu đã assign bàn rồi → release về EMPTY
        releaseTable(r);

        r.setStatus(ReservationStatus.CANCELLED);
        r.setCancelledBy(cancelledBy);
        r.setCancelReason(reason);

        return toResponse(reservationRepository.save(r));
    }

    // AUTO ASSIGN TABLE
    // Chạy mỗi phút — tìm reservation sắp đến và assign bàn
    // @Scheduled(fixedRate = 60000) — khai báo ở class khác hoặc dùng @Scheduled trực tiếp
    @Override
    public void autoAssignTables() {
        OffsetDateTime now  = OffsetDateTime.now();
        OffsetDateTime soon = now.plusMinutes(ASSIGN_BEFORE_MINUTES);

        // Tìm reservation CONFIRMED, chưa có bàn, sắp đến trong 30 phút
        List<Reservation> upcoming = reservationRepository
                .findUnassignedUpcoming(now, soon);

        upcoming.forEach(reservation -> {

            // Tìm bàn EMPTY phù hợp nhất — vừa đủ chỗ, lãng phí ít nhất
            tableRepository
                    .findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                    .stream()
                    .filter(t -> t.getCapacity() >= reservation.getPartySize())
                    .min((a, b) -> Integer.compare(
                            a.getCapacity() - reservation.getPartySize(),
                            b.getCapacity() - reservation.getPartySize()
                    ))
                    .ifPresent(table -> {
                        // Giữ bàn → RESERVED
                        table.setStatus(TableStatus.RESERVED);
                        // Gắn bàn vào reservation
                        reservation.setTableId(table.getId());
                    });
        });
        // @Transactional tự save tất cả thay đổi
    }

    // AUTO CANCEL EXPIRED
    // Chạy mỗi phút — hủy reservation quá giờ không thấy khách
    @Override
    public void autoCancelExpired() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(AUTO_CANCEL_MINUTES);

        List<Reservation> expired = reservationRepository
                .findByStatusAndReservedAtBefore(ReservationStatus.CONFIRMED, cutoff);

        expired.forEach(r -> {
            // Release bàn về EMPTY
            releaseTable(r);

            r.setStatus(ReservationStatus.CANCELLED);
            r.setCancelReason(
                "Tự động hủy: khách không đến sau " + AUTO_CANCEL_MINUTES + " phút"
            );
        });
    }

    // Không có slot cố định — tính theo thời điểm khách muốn
    @Override
    @Transactional(readOnly = true)
    public List<AvailableSlot> getAvailableSlots(LocalDate date, Integer partySize) {

        // Tổng bàn đủ chỗ ngồi
        long totalCapable = tableRepository
                .findByIsActiveTrue()
                .stream()
                .filter(t -> t.getCapacity() >= partySize)
                .count();

        // Lấy tất cả reservation trong ngày đó
        OffsetDateTime dayStart = toStartOfDay(date);
        OffsetDateTime dayEnd   = dayStart.plusDays(1);

        List<Reservation> dayReservations = reservationRepository
                .findByReservedAtBetweenOrderByReservedAtAsc(dayStart, dayEnd)
                .stream()
                .filter(r -> r.getStatus() == ReservationStatus.PENDING
                          || r.getStatus() == ReservationStatus.CONFIRMED)
                .toList();

        // Tạo slot mỗi 30 phút — từ 10:00 đến 22:00
        // Không cố định mà tính động dựa theo reservation thực tế
        List<AvailableSlot> slots = new java.util.ArrayList<>();
        LocalTime cursor = LocalTime.of(10, 0);
        LocalTime closing = LocalTime.of(22, 0);

        while (cursor.isBefore(closing)) {
            LocalTime slotStart = cursor;
            LocalTime slotEnd   = cursor.plusHours(RESERVATION_DURATION_HOURS);

            OffsetDateTime slotStartDt = date.atTime(slotStart).atOffset(ZoneOffset.UTC);
            OffsetDateTime slotEndDt   = date.atTime(slotEnd).atOffset(ZoneOffset.UTC);

            // Đếm reservation chồng lên slot này
            long booked = dayReservations.stream()
                    .filter(r -> {
                        // Reservation chồng lên slot nếu khoảng thời gian giao nhau
                        OffsetDateTime rStart = r.getReservedAt()
                                .minusHours(RESERVATION_DURATION_HOURS);
                        OffsetDateTime rEnd   = r.getReservedAt()
                                .plusHours(RESERVATION_DURATION_HOURS);
                        return rStart.isBefore(slotEndDt) && rEnd.isAfter(slotStartDt);
                    })
                    .count();

            int available = (int) Math.max(totalCapable - booked, 0);

            slots.add(AvailableSlot.builder()
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .availableTables(available)
                    .build());

            cursor = cursor.plusMinutes(30); // bước nhảy 30 phút
        }

        return slots;
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
                .pending((int)   all.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count())
                .confirmed((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .arrived((int)   all.stream().filter(r -> r.getStatus() == ReservationStatus.ARRIVED).count())
                .cancelled((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .build();
    }
}