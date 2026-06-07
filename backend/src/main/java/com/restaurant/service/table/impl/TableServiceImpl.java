package com.restaurant.service.table.impl;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.table.CreateTableRequest;
import com.restaurant.dto.request.table.OpenTableRequest;
import com.restaurant.dto.request.table.UpdateTableRequest;
import com.restaurant.dto.response.table.TableLayoutResponse;
import com.restaurant.dto.response.table.TableResponse;
import com.restaurant.model.Table;
import com.restaurant.model.Reservation;
import com.restaurant.repository.ReservationRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.table.TableService;
import com.restaurant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private static final ZoneId RESTAURANT_ZONE            = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int    RESERVATION_DURATION_HOURS = 3;

    /**
     * Trạng thái thực sự chiếm bàn — đồng bộ với ReservationServiceImpl.
     * PENDING không block vì chưa được xác nhận.
     */
    private static final Set<ReservationStatus> BLOCKING_STATUSES =
            Set.of(ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED);

    private final TableRepository       tableRepository;
    private final ReservationRepository reservationRepository;
    private final OrderRepository orderRepository;

    // ------------------------------------------------------------------ helpers

    private Table findOrThrow(UUID id) {
        Table table = tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Khong tim thay ban: " + id));
        if (table.getDeletedAt() != null) {
            throw new BusinessException("Ban da duoc xoa: " + id);
        }
        return table;
    }

    private TableResponse toResponse(Table table) {
        return TableResponse.builder()
                .id(table.getId())
                .number(table.getNumber())
                .capacity(table.getCapacity())
                .status(table.getStatus() != null ? table.getStatus().name() : TableStatus.EMPTY.name())
                .area(table.getArea())
                .isActive(table.getIsActive())
                .updatedAt(table.getUpdatedAt())
                .deletedAt(table.getDeletedAt())
                .build();
    }

    /**
     * Simulate gán bàn để tìm pool bàn thực sự còn trống tại một thời điểm.
     *
     * Thuật toán (đồng bộ với ReservationServiceImpl#hasCapacity):
     *   1. Pool = tất cả bàn active đang EMPTY.
     *   2. Reservation BLOCKING đã có tableId → xoá bàn đó khỏi pool.
     *   3. Reservation BLOCKING chưa có tableId → greedy assign bàn nhỏ nhất vừa đủ
     *      trong pool (sắp xếp partySize tăng dần), xoá bàn đó khỏi pool.
     *   4. Trả về pool còn lại — đây là bàn thực sự tự do cho walk-in.
     */
    private List<Table> simulateAvailablePool(OffsetDateTime around) {
        List<Reservation> blocking = reservationRepository
                .findByReservedAtBetween(
                        around.minusHours(RESERVATION_DURATION_HOURS),
                        around.plusHours(RESERVATION_DURATION_HOURS)
                )
                .stream()
                .filter(r -> BLOCKING_STATUSES.contains(r.getStatus()))
                .toList();

        // Step 1: pool ban đầu = tất cả bàn EMPTY active và chưa bị xóa
        List<Table> pool = tableRepository.findByIsActiveTrueAndStatusAndDeletedAtIsNull(TableStatus.EMPTY)
                .stream()
                .collect(Collectors.toCollection(java.util.ArrayList::new));

        // Step 2: xoá bàn đã được gán cụ thể
        Set<UUID> assignedTableIds = blocking.stream()
                .filter(r -> r.getTableId() != null)
                .map(r -> r.getTableId())
                .collect(Collectors.toSet());
        pool.removeIf(t -> assignedTableIds.contains(t.getId()));

        // Step 3: simulate gán bàn cho reservation chưa có tableId
        blocking.stream()
                .filter(r -> r.getTableId() == null)
                .sorted(Comparator.comparingInt(r -> r.getPartySize()))
                .forEach(r ->
                    pool.stream()
                            .filter(t -> t.getCapacity() >= r.getPartySize())
                            .min(Comparator.comparingInt(Table::getCapacity))
                            .ifPresent(pool::remove)
                );

        return pool;
    }

    // ================================================================== public API

    @Override
    @Transactional(readOnly = true)
    public Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable) {
        if (area != null && !area.isBlank() && status != null) {
            return tableRepository.findByIsActiveTrueAndAreaAndStatusAndDeletedAtIsNull(area, status, pageable).map(this::toResponse);
        }
        if (area != null && !area.isBlank()) {
            return tableRepository.findByIsActiveTrueAndAreaAndDeletedAtIsNull(area, pageable).map(this::toResponse);
        }
        if (status != null) {
            return tableRepository.findByIsActiveTrueAndStatusAndDeletedAtIsNull(status, pageable).map(this::toResponse);
        }
        return tableRepository.findByIsActiveTrueAndDeletedAtIsNull(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public TableResponse createTable(CreateTableRequest request) {
        if (tableRepository.existsByNumberAndDeletedAtIsNull(request.getNumber())) {
            throw new BusinessException("So ban '" + request.getNumber() + "' da ton tai");
        }

        Table table = Table.builder()
                .number(request.getNumber())
                .capacity(request.getCapacity())
                .area(request.getArea())
                .status(TableStatus.EMPTY)
                .isActive(true)
                .build();

        return toResponse(tableRepository.save(table));
    }

    @Override
    public TableResponse updateTable(UUID id, UpdateTableRequest request) {
        Table table = findOrThrow(id);

        if (!table.getNumber().equals(request.getNumber())
            && tableRepository.existsByNumberAndDeletedAtIsNull(request.getNumber())) {
            throw new BusinessException("So ban '" + request.getNumber() + "' da ton tai");
        }

        table.setNumber(request.getNumber());
        table.setCapacity(request.getCapacity());
        table.setArea(request.getArea());

        return toResponse(tableRepository.save(table));
    }

    @Override
    public void deleteTable(UUID id) {
        Table table = findOrThrow(id);

        if (table.getStatus() == TableStatus.SERVING) {
            throw new BusinessException("Khong the xoa ban dang co khach");
        }

        table.setIsActive(false);
        table.setDeletedAt(OffsetDateTime.now());
        tableRepository.save(table);
    }

    /**
     * Mở bàn cho khách walk-in.
     *
     * Điều kiện hợp lệ:
     *   1. Bàn phải đang EMPTY.
     *   2. Bàn không được nằm trong danh sách bị giữ bởi reservation CONFIRMED/ARRIVED
     *      trong cửa sổ ±RESERVATION_DURATION_HOURS quanh thời điểm hiện tại
     *      (tức bàn này phải có mặt trong kết quả getAvailableTables).
     */
    @Override
    public TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId) {
        Table table = findOrThrow(id);

        if (table.getStatus() != TableStatus.EMPTY) {
            throw new BusinessException("Ban " + table.getNumber() + " khong trong (dang " + table.getStatus() + ")");
        }

        OffsetDateTime now           = OffsetDateTime.now(RESTAURANT_ZONE);
        List<Table>    availablePool = simulateAvailablePool(now);
        boolean        isAvailable   = availablePool.stream().anyMatch(t -> t.getId().equals(table.getId()));
        if (!isAvailable) {
            throw new BusinessException(
                    "Ban " + table.getNumber() + " dang duoc giu cho reservation da xac nhan, khong the mo truc tiep."
            );
        }

        // Temporarily disabled until Order module is implemented.
        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Ban da co order dang mo");
        }

        table.setStatus(TableStatus.SERVING);
        tableRepository.save(table);

        return toResponse(table);
    }

    @Override
    public TableResponse closeTable(UUID id) {
        Table table = findOrThrow(id);

        if (table.getStatus() != TableStatus.SERVING) {
            throw new BusinessException("Ban khong trong trang thai SERVING");
        }

        // Temporarily disabled until Order module is implemented.
        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Ban van con hoa don chua thanh toan");
        }

        table.setStatus(TableStatus.EMPTY);
        return toResponse(tableRepository.save(table));
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<Table> all = tableRepository.findByIsActiveTrueAndDeletedAtIsNull();

        long available = all.stream().filter(t -> t.getStatus() == TableStatus.EMPTY).count();
        long occupied  = all.stream().filter(t -> t.getStatus() == TableStatus.SERVING).count();
        long cleaning  = all.stream().filter(t -> t.getStatus() == TableStatus.CLEANING).count();

        return TableLayoutResponse.builder()
                .tables(all.stream().map(this::toResponse).toList())
                .total(all.size())
                .available((int) available)
                .occupied((int) occupied)
                .cleaning((int) cleaning)
                .build();
    }

    /**
     * Trả về danh sách bàn còn trống cho khách walk-in tại một thời điểm cụ thể.
     *
     * Dùng simulateAvailablePool để tính đúng pool bàn tự do sau khi đã trừ đi
     * cả reservation đã gán bàn lẫn reservation CONFIRMED chưa gán (sẽ chiếm bàn).
     * Kết quả lọc theo capacity và sắp xếp vừa đủ chỗ ưu tiên trước.
     */
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables(Integer capacity, LocalDateTime dateTime) {
        OffsetDateTime around = dateTime.atZone(RESTAURANT_ZONE).toOffsetDateTime();

        return simulateAvailablePool(around)
                .stream()
                .filter(t -> t.getCapacity() >= capacity)
                .sorted(Comparator.comparingInt(t -> t.getCapacity() - capacity))
                .map(this::toResponse)
                .toList();
    }
}
