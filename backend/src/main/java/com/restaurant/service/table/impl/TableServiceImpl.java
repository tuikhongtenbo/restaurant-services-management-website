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
import org.springframework.data.domain.PageImpl;
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

    private static final Set<ReservationStatus> BLOCKING_STATUSES =
            Set.of(ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED);

    private final TableRepository       tableRepository;
    private final ReservationRepository reservationRepository;
    private final OrderRepository orderRepository;

    private Table findOrThrow(UUID id) {
        Table table = tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Khong tim thay ban: " + id));
        if (table.getDeletedAt() != null) {
            throw new BusinessException("Ban da duoc xoa: " + id);
        }
        return table;
    }

    private boolean isTableServing(UUID tableId) {
        return orderRepository.existsByTableIdAndStatus(tableId, OrderStatus.OPEN);
    }

    private boolean isTableReserved(UUID tableId) {
        return reservationRepository.existsByTableIdAndStatus(tableId, ReservationStatus.CONFIRMED);
    }

    private TableStatus computeStatus(Table table) {
        if (!table.getIsActive()) {
            if (isTableServing(table.getId())) {
                return TableStatus.SERVING;
            } else if (isTableReserved(table.getId())) {
                return TableStatus.RESERVED;
            }
            // Nếu bàn đã được kích hoạt (isActive=false) mà không có đơn OPEN hay đặt bàn CONFIRMED, 
            // có nghĩa là đơn đã được thanh toán (PAID) và đang chờ dọn dẹp (PAID status cho UI)
            return TableStatus.PAID;
        }
        return TableStatus.OPEN;
    }

    private boolean isNotSoftDeleted(Table table) {
        // Nếu isActive = true -> Bàn đang hoạt động (trống)
        if (table.getIsActive()) return true;
        // Nếu isActive = false -> Có thể đang phục vụ, đã đặt, hoặc bị xoá (soft delete)
        return isTableServing(table.getId()) || isTableReserved(table.getId());
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

        Set<UUID> assignedTableIds = blocking.stream()
                .filter(r -> r.getTableId() != null)
                .map(r -> r.getTableId())
                .collect(Collectors.toSet());
        pool.removeIf(t -> assignedTableIds.contains(t.getId()));

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

        if (isTableServing(id)) {
            throw new BusinessException("Khong the xoa ban dang co khach");
        }

        table.setIsActive(false);
        table.setDeletedAt(OffsetDateTime.now());
        tableRepository.save(table);
    }

    @Override
    public TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId) {
        Table table = findOrThrow(id);

        if (!table.getIsActive()) {
            throw new BusinessException("Ban " + table.getNumber() + " khong trong");
        }

        OffsetDateTime now           = OffsetDateTime.now(RESTAURANT_ZONE);
        List<Table>    availablePool = simulateAvailablePool(now);
        boolean        isAvailable   = availablePool.stream().anyMatch(t -> t.getId().equals(table.getId()));
        if (!isAvailable) {
            throw new BusinessException(
                    "Ban " + table.getNumber() + " dang duoc giu cho reservation da xac nhan, khong the mo truc tiep."
            );
        }

        if (isTableServing(id)) {
            throw new BusinessException("Ban da co order dang mo");
        }

        table.setIsActive(false); // Chuyển sang bận
        tableRepository.save(table);

        return toResponse(table);
    }

    @Override
    public TableResponse closeTable(UUID id) {
        Table table = findOrThrow(id);

        if (isTableServing(id)) {
            throw new BusinessException("Ban van con hoa don chua thanh toan");
        }

        table.setIsActive(true); // Trả lại thành bàn trống
        return toResponse(tableRepository.save(table));
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<Table> all = tableRepository.findByIsActiveTrueAndDeletedAtIsNull();

        long available = all.stream().filter(t -> computeStatus(t) == TableStatus.OPEN).count();
        long occupied  = all.stream().filter(t -> computeStatus(t) == TableStatus.SERVING).count();
        long cleaning  = all.stream().filter(t -> computeStatus(t) == TableStatus.PAID).count();

        return TableLayoutResponse.builder()
                .tables(all.stream().map(this::toResponse).toList())
                .total(all.size())
                .available((int) available)
                .occupied((int) occupied)
                .cleaning((int) cleaning)
                .build();
    }

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
