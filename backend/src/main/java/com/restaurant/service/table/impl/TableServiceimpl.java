package com.restaurant.service.table.impl;

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.dto.request.table.CreateTableRequest;
import com.restaurant.dto.request.table.OpenTableRequest;
import com.restaurant.dto.request.table.UpdateTableRequest;
import com.restaurant.dto.response.table.TableLayoutResponse;
import com.restaurant.dto.response.table.TableResponse;
import com.restaurant.model.Table;
import com.restaurant.repository.ReservationRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.table.TableService;
//import com.restaurant.repository.OrderRepository;;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TableRepository tableRepository;
    private final ReservationRepository reservationRepository;
    //private final OrderRepository orderRepository;

    private Table findOrThrow(UUID id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Khong tim thay ban: " + id));
    }

    private TableResponse toResponse(Table table) {
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

    @Override
    @Transactional(readOnly = true)
    public Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable) {
        if (area != null && !area.isBlank() && status != null) {
            return tableRepository.findByIsActiveTrueAndAreaAndStatus(area, status, pageable).map(this::toResponse);
        }
        if (area != null && !area.isBlank()) {
            return tableRepository.findByIsActiveTrueAndArea(area, pageable).map(this::toResponse);
        }
        if (status != null) {
            return tableRepository.findByIsActiveTrueAndStatus(status, pageable).map(this::toResponse);
        }
        return tableRepository.findByIsActiveTrue(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public TableResponse createTable(CreateTableRequest request) {
        if (tableRepository.existsByNumber(request.getNumber())) {
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
                && tableRepository.existsByNumber(request.getNumber())) {
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
        tableRepository.save(table);
    }

    @Override
    public TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId) {
        Table table = findOrThrow(id);

        if (table.getStatus() != TableStatus.EMPTY) {
            throw new BusinessException("Ban " + table.getNumber() + " khong trong (dang " + table.getStatus() + ")");
        }

        // Temporarily disabled until Order module is implemented.
        // if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
        //     throw new BusinessException("Ban da co order dang mo");
        // }

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
        // if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
        //     throw new BusinessException("Ban van con hoa don chua thanh toan");
        // }

        table.setStatus(TableStatus.EMPTY);
        return toResponse(tableRepository.save(table));
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<Table> all = tableRepository.findByIsActiveTrue();

        long available = all.stream().filter(t -> t.getStatus() == TableStatus.EMPTY).count();
        long occupied = all.stream().filter(t -> t.getStatus() == TableStatus.SERVING).count();
        long cleaning = all.stream().filter(t -> t.getStatus() == TableStatus.CLEANING).count();

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
        Set<UUID> reservedTableIds = reservationRepository
                .findByReservedAtBetween(
                        dateTime.minusHours(2).atZone(RESTAURANT_ZONE).toOffsetDateTime(),
                        dateTime.plusHours(2).atZone(RESTAURANT_ZONE).toOffsetDateTime()
                )
                .stream()
                .filter(r -> r.getTableId() != null)
                .filter(r -> Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.ARRIVED)
                        .contains(r.getStatus()))
                .map(r -> r.getTableId())
                .collect(Collectors.toSet());

        return tableRepository.findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                .stream()
                .filter(t -> t.getCapacity() >= capacity)
                .filter(t -> !reservedTableIds.contains(t.getId()))
                .sorted((a, b) -> Integer.compare(
                        a.getCapacity() - capacity,
                        b.getCapacity() - capacity
                ))
                .map(this::toResponse)
                .toList();
    }
}
