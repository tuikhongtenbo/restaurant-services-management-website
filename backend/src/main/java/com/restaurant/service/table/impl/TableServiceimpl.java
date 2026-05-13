package com.restaurant.service.impl;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exception.BusinessException;
import com.restaurant.dto.request.CreateTableRequest;
import com.restaurant.dto.request.OpenTableRequest;
import com.restaurant.dto.request.UpdateTableRequest;
import com.restaurant.dto.response.TableLayoutResponse;
import com.restaurant.dto.response.TableResponse;
import com.restaurant.model.Order;
import com.restaurant.model.Table;
import com.restaurant.repository.OrderRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;

    // Helper methods
    private Table findOrThrow(UUID id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bàn: " + id));
    }
    // Helper method 
    private TableResponse toResponse(Table table) {
        return TableResponse.builder()
                .id(table.getId())
                .number(table.getNumber())
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .isActive(table.getIsActive())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable) {
        if (status != null) {
            return tableRepository
                    .findByIsActiveTrueAndStatus(area, status, pageable)
                    .map(this::toResponse); 
        }

        return tableRepository
                .findByIsActiveTrue(pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public TableResponse createTable(CreateTableRequest request) {
        if (tableRepository.existsByNumber(request.getNumber())) {
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        Table table = Table.builder()
                .number(request.getNumber())
                .capacity(request.getCapacity())
                .build();

        tableRepository.save(table);
    }

    @Override
    public TableResponse updateTable(UUID id, UpdateTableRequest request) {
        Table table = findOrThrow(id);

        if (!table.getNumber().equals(request.getNumber())
                && tableRepository.existsByNumber(request.getNumber())) {
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        table.setNumber(request.getNumber());
        table.setCapacity(request.getCapacity());

        tableRepository.save(table);
    }

    @Override
    public void deleteTable(UUID id) {
        Table table = findOrThrow(id);

        if (table.getStatus() == TableStatus.SERVING) {
            throw new BusinessException("Không thể xóa bàn đang có khách");
        }

        table.setIsActive(false);
        tableRepository.save(table);
    }

    @Override
    public TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId) {
        Table table = findOrThrow(id);

        if (table.getStatus() != TableStatus.EMPTY) {
            throw new BusinessException(
                "Bàn " + table.getNumber() + " không trống (đang " + table.getStatus() + ")"
            );
        }

        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Bàn đã có order đang mở");
        }

        Order order = Order.builder()
                .table(table)
                .build();
        orderRepository.save(order);

        table.setStatus(TableStatus.SERVING);

        tableRepository.save(table);
        return toResponse(table);
    }

    @Override
    public TableResponse closeTable(UUID id) {
        Table table = findOrThrow(id);

        if (table.getStatus() != TableStatus.SERVING) {
            throw new BusinessException("Bàn không trong trạng thái SERVING");
        }

        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Bàn còn order chưa thanh toán");
        }

        table.setStatus(TableStatus.CLEANING);

        tableRepository.save(table);
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<Table> all = tableRepository.findByIsActiveTrue();

        long available = all.stream()
                .filter(t -> t.getStatus() == TableStatus.EMPTY).count();
        long occupied  = all.stream()
                .filter(t -> t.getStatus() == TableStatus.SERVING).count();
        long cleaning  = all.stream()
                .filter(t -> t.getStatus() == TableStatus.CLEANING).count();

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
        return tableRepository
                .findByIsActiveTrueAndStatus(TableStatus.EMPTY)
                .stream()
                .filter(t -> t.getCapacity() >= capacity)
                .sorted((a, b) -> Integer.compare(
                        a.getCapacity() - capacity,
                        b.getCapacity() - capacity
                ))
                .map(this::toResponse)
                .toList();
    }
}