package com.restaurant.service.impl;

import com.restaurant.common.enums.ReservationSource;
import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exception.BusinessException;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
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
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final TableRepository tableRepository;

    // Hằng số cấu hình hệ thống thay thế cho logic .getValue() cũ nhằm tránh lỗi biên dịch
    private static final int RESERVATION_DURATION_HOURS = 2;
    private static final int ASSIGN_BEFORE_MINUTES = 30;
    private static final int AUTO_CANCEL_MINUTES = 15;

    // PRIVATE HELPERS
    
    // Giải phóng trạng thái bàn ăn về EMPTY khi đơn bị hủy (Cancel) hoặc khách không đến (No-Show)
    private void releaseTable(Reservation reservation) {
        if (reservation.getTableId() != null) {
            tableRepository.findById(reservation.getTableId())
                    .ifPresent(table -> {
                        table.setStatus(TableStatus.EMPTY);
                        tableRepository.save(table);
                    });
            reservation.setTableId(null);
            reservationRepository.save(reservation);
        }
    }

    private OffsetDateTime toStartOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
    }

    private Reservation findOrThrow(UUID id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy thông tin đặt bàn có ID: " + id));
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
                .createdAt(r.getCreatedAt())
                .build();
    }

    // CORE SERVICES (OVERRIDDEN FROM INTERFACE)
   

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservations(LocalDate date, ReservationStatus status, Pageable pageable) {
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
                    .findByReservedAtBetweenOrderByReservedAtAsc(start, start.plusDays(1), pageable)
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
    public ReservationResponse createAndConfirm(CreateReservationRequest request, UUID staffId) {
        // Khởi tạo thực thể đặt bàn ở trạng thái PENDING ban đầu
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

        reservationRepository.save(r);

        // Kiểm tra dung lượng/công suất phục vụ khả dụng của quán trong khung giờ ±2 tiếng
        OffsetDateTime wantedTime = request.getReservedAt();
        OffsetDateTime rangeStart = wantedTime.minusHours(RESERVATION_DURATION_HOURS);
        OffsetDateTime rangeEnd   = wantedTime.plusHours(RESERVATION_DURATION_HOURS);

        // Đếm số lượng bàn đang hoạt động có sức chứa đáp ứng được đoàn khách
        long totalCapable = tableRepository
                .findByIsActiveTrue()
                .stream()
                .filter(t -> t.getCapacity() >= request.getPartySize())
                .count();

        // Đếm số lượng bàn cùng loại đã bị giữ chỗ trước đó bởi các đơn CONFIRMED hoặc ARRIVED
        long alreadyBooked = reservationRepository
                .countByStatusInAndReservedAtBetween(
                        List.of(ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED),
                        rangeStart, rangeEnd
                );

        // Nếu vượt quá giới hạn công suất chịu tải của hệ thống bàn ăn -> Tự động từ chối/hủy đơn
        if (alreadyBooked >= totalCapable) {
            r.setStatus(ReservationStatus.CANCELLED); 
            reservationRepository.save(r);
            throw new BusinessException("Nhà hàng đã hết công suất bàn khả dụng cho quy mô " + request.getPartySize() + " người vào khung giờ này.");
        }

        // Đủ điều kiện đáp ứng -> Chuyển sang CONFIRMED và lưu vết nhân viên duyệt
        r.setStatus(ReservationStatus.CONFIRMED);
        r.setConfirmedBy(staffId);
        return toResponse(reservationRepository.save(r));
    }
    
    @Override
    public ReservationResponse update(UUID id, UpdateReservationRequest request) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.PENDING && r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Hệ thống chỉ cho phép thay đổi thông tin lịch đặt ở trạng thái PENDING hoặc CONFIRMED");
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
            throw new BusinessException("Chỉ cho phép Check-in đối với những đơn đặt bàn đã được CONFIRMED");
        }

        if (r.getTableId() == null) {
            throw new BusinessException("Đơn đặt này chưa được chỉ định vị trí bàn cụ thể. Vui lòng xếp bàn trước khi Check-in!");
        }

        // Tìm bàn tương ứng được xếp bởi scheduler để đổi trạng thái bàn sang SERVING
        Table table = tableRepository.findById(r.getTableId())
                .orElseThrow(() -> new BusinessException("Không tìm thấy bàn ăn tương thích trong cơ sở dữ liệu."));
        
        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);

        r.setStatus(ReservationStatus.ARRIVED);
        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse noShow(UUID id) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessException("Chỉ được đánh dấu khách không đến (NO_SHOW) với đơn hàng trạng thái CONFIRMED");
        }

        releaseTable(r);
        r.setStatus(ReservationStatus.NO_SHOW);

        return toResponse(reservationRepository.save(r));
    }

    @Override
    public ReservationResponse cancel(UUID id, UUID cancelledBy, String reason) {
        Reservation r = findOrThrow(id);

        if (r.getStatus() == ReservationStatus.ARRIVED) {
            throw new BusinessException("Khách hàng đã đến nhà hàng nhận bàn và đang dùng bữa, không thể hủy.");
        }
        if (r.getStatus() == ReservationStatus.CANCELLED) {
            throw new BusinessException("Yêu cầu đặt bàn này đã được hủy bỏ từ trước đó.");
        }

        releaseTable(r);

        r.setStatus(ReservationStatus.CANCELLED);
        r.setCancelledBy(cancelledBy);
        r.setCancelReason(reason);

        return toResponse(reservationRepository.save(r));
    }

    // SCHEDULED AUTOMATION TASKS

    @Scheduled(fixedRate = 60000) // Tự động quét và gán vị trí bàn tối ưu mỗi 60 giây
    @Override
    public void autoAssignTables() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime soon = now.plusMinutes(ASSIGN_BEFORE_MINUTES);

        // Lấy danh sách các đơn đã CONFIRMED, sắp đến giờ hẹn và chưa có bàn gán vào
        List<Reservation> upcoming = reservationRepository.findUnassignedUpcoming(now, soon);

        upcoming.forEach(reservation -> {
            tableRepository.findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                    .stream()
                    .filter(table -> table.getCapacity() >= reservation.getPartySize())
                    // Thuật toán: Chọn bàn dư ít ghế trống nhất để tiết kiệm không gian bàn lớn cho đoàn khách sau
                    .min((a, b) -> Integer.compare(
                            a.getCapacity() - reservation.getPartySize(),
                            b.getCapacity() - reservation.getPartySize()
                    ))
                    .ifPresent(table -> {
                        table.setStatus(TableStatus.RESERVED); 
                        reservation.setTableId(table.getId());

                        reservationRepository.save(reservation);
                        tableRepository.save(table);
                    });
        });
    }

    @Scheduled(fixedRate = 60000) // Tự động quét và hủy đơn quá hạn check-in mỗi 60 giây
    @Override
    public void autoCancelExpired() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(AUTO_CANCEL_MINUTES);

        List<Reservation> expired = reservationRepository
                .findByStatusAndReservedAtBefore(ReservationStatus.CONFIRMED, cutoff);

        expired.forEach(r -> {
            releaseTable(r);
            r.setStatus(ReservationStatus.CANCELLED);
            r.setCancelReason("Hệ thống tự động hủy: Quá " + AUTO_CANCEL_MINUTES + " phút so với lịch hẹn mà khách không đến check-in.");
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
                .pending((int)   all.stream().filter(r -> r.getStatus() == ReservationStatus.PENDING).count())
                .confirmed((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CONFIRMED).count())
                .arrived((int)   all.stream().filter(r -> r.getStatus() == ReservationStatus.ARRIVED).count())
                .cancelled((int) all.stream().filter(r -> r.getStatus() == ReservationStatus.CANCELLED).count())
                .build();
    }
}