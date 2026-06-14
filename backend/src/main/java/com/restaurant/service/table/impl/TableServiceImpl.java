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

    private boolean isNotSoftDeleted(Table table) {
        return table.getIsActive();
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

        // Lấy tất cả các bàn thực sự trống (isActive = true)
        List<Table> pool = tableRepository.findAll().stream()
                .filter(Table::getIsActive)
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
        // Do dữ liệu status là ảo nên phải filter bằng Java
        List<Table> allTables = tableRepository.findAll();
        
        List<TableResponse> filtered = allTables.stream()
                .filter(this::isNotSoftDeleted)
                .filter(t -> area == null || area.isBlank() || area.equals(t.getArea()))
                .filter(t -> status == null || getCurrentStatus(t) == status)
                .map(this::toResponse)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        
        if (start > filtered.size()) {
            return new PageImpl<>(List.of(), pageable, filtered.size());
        }
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
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

    private TableStatus getCurrentStatus(Table table) {
        return table.getStatus() != null ? table.getStatus() : TableStatus.EMPTY;
    }

    @Override
    public void deleteTable(UUID id) {
        Table table = findOrThrow(id);

        if (getCurrentStatus(table) == TableStatus.SERVING) {
            throw new BusinessException("Khong the xoa ban dang co khach");
        }

        table.setIsActive(false);
        table.setDeletedAt(OffsetDateTime.now());
        tableRepository.save(table);
    }

    @Override
    public TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId) {
        Table table = findOrThrow(id);

        if (getCurrentStatus(table) != TableStatus.EMPTY) {
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

        table.setStatus(TableStatus.SERVING); // Chuyển sang bận
        tableRepository.save(table);

        return toResponse(table);
    }

    @Override
    public TableResponse closeTable(UUID id) {
        Table table = findOrThrow(id);

        if (getCurrentStatus(table) == TableStatus.SERVING) {
            throw new BusinessException("Ban van con hoa don chua thanh toan");
        }

        table.setStatus(TableStatus.EMPTY); // Trả lại thành bàn trống
        return toResponse(tableRepository.save(table));
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<Table> all = tableRepository.findAll().stream()
                .filter(this::isNotSoftDeleted)
                .collect(Collectors.toList());

        long available = all.stream().filter(t -> getCurrentStatus(t) == TableStatus.EMPTY).count();
        long occupied  = all.stream().filter(t -> getCurrentStatus(t) == TableStatus.SERVING).count();
        long cleaning  = all.stream().filter(t -> getCurrentStatus(t) == TableStatus.CLEANING).count();

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
