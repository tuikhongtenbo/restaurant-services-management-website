package com.restaurant.service.impl;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exception.BusinessException; // ← dùng BusinessException
import com.restaurant.dto.request.CreateTableRequest;
import com.restaurant.dto.request.OpenTableRequest;
import com.restaurant.dto.request.UpdateTableRequest;
import com.restaurant.dto.response.TableLayoutResponse;
import com.restaurant.dto.response.TableResponse;
import com.restaurant.mapper.TableMapper;              // ← dùng Mapper
import com.restaurant.model.Order;
import com.restaurant.model.RestaurantTable;
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


@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final TableRepository tableRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<TableResponse> getTables(
            String area,
            TableStatus status,
            Pageable pageable) {

        if (status != null) {
            return tableRepository
                    .findByIsActiveTrueAndStatus(area, status, pageable)
                    .map(table -> TableResponse.builder()
                            .id(table.getId())
                            .tableNumber(table.getTableNumber())
                            .area(table.getArea())
                            .status(table.getStatus())
                            .capacity(table.getCapacity())
                            .build());
        }

        return tableRepository
                .findByIsActiveTrue(pageable)
                .map(table -> TableResponse.builder()
                        .id(table.getId())
                        .tableNumber(table.getTableNumber())
                        .area(table.getArea())
                        .status(table.getStatus())
                        .capacity(table.getCapacity())
                        .build());
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(UUID id) {

        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Không tìm thấy bàn: " + id
                        ));

        return TableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .area(table.getArea())
                .status(table.getStatus())
                .capacity(table.getCapacity())
                .build();
    }

    @Override
    public TableResponse createTable(CreateTableRequest request) {
        if (tableRepository.existsByNumber(request.getNumber())) {
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        RestaurantTable table = RestaurantTable.builder()
                .number(request.getNumber())
                .capacity(request.getCapacity())
                .build();

        return tableMapper.toTableResponse(tableRepository.save(table));
    }

    @Override
    public TableResponse updateTable(UUID id, UpdateTableRequest request) {
        RestaurantTable table = findOrThrow(id);

        // Đổi số bàn → kiểm tra số mới chưa bị dùng bởi bàn khác
        if (!table.getNumber().equals(request.getNumber())
                && tableRepository.existsByNumber(request.getNumber())) {
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        table.setNumber(request.getNumber());
        table.setCapacity(request.getCapacity());

        return tableMapper.toTableResponse(table);
    }

    @Override
    public TableResponse updateTable(UUID id, UpdateTableRequest request) {
        RestaurantTable table = findOrThrow(id);

        // Đổi số bàn → kiểm tra số mới chưa bị dùng bởi bàn khác
        if (!table.getNumber().equals(request.getNumber())
                && tableRepository.existsByNumber(request.getNumber())) {
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        table.setNumber(request.getNumber());
        table.setCapacity(request.getCapacity());

        return tableMapper.toTableResponse(table);
    }

    @Override
    public TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId) {
        RestaurantTable table = findOrThrow(id);

        // Validate giống pattern teammate: check từng điều kiện, ném lỗi ngay
        if (table.getStatus() != TableStatus.EMPTY) {
            throw new BusinessException(
                    "Bàn " + table.getNumber() + " không trống (đang " + table.getStatus() + ")"
            );
        }

        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Bàn đã có order đang mở");
        }

        // Tạo order mới — gắn với bàn và waiter
        Order order = Order.builder()
                .table(table)
                .build();
        orderRepository.save(order);

        // Đổi trạng thái bàn
        table.setStatus(TableStatus.SERVING);

        return tableMapper.toTableResponse(table);
    }

    @Override
    public TableResponse closeTable(UUID id) {
        RestaurantTable table = findOrThrow(id);

        if (table.getStatus() != TableStatus.SERVING) {
            throw new BusinessException("Bàn không trong trạng thái SERVING");
        }

        // Giống pattern teammate: validate business rule trước khi thực hiện
        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Bàn còn order chưa thanh toán, không thể đóng");
        }

        table.setStatus(TableStatus.CLEANING);

        return tableMapper.toTableResponse(table);
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<RestaurantTable> all = tableRepository.findByIsActiveTrue();

        // Dùng stream filter đếm từng loại — không cần thêm query DB
        long available = all.stream()
                .filter(t -> t.getStatus() == TableStatus.EMPTY).count();
        long occupied  = all.stream()
                .filter(t -> t.getStatus() == TableStatus.SERVING).count();
        long cleaning  = all.stream()
                .filter(t -> t.getStatus() == TableStatus.CLEANING).count();

        return TableLayoutResponse.builder()
                .tables(all.stream().map(tableMapper::toTableResponse).toList())
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
                .sorted((a, b) -> {
                    // Gợi ý bàn "vừa đủ" — lãng phí ít nhất
                    // 3 người → bàn 4 (waste=1) hơn bàn 8 (waste=5)
                    int wasteA = a.getCapacity() - capacity;
                    int wasteB = b.getCapacity() - capacity;
                    return Integer.compare(wasteA, wasteB);
                })
                .map(tableMapper::toTableResponse)
                .toList();
    }

    private RestaurantTable findOrThrow(UUID id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bàn: " + id));
    }
}
