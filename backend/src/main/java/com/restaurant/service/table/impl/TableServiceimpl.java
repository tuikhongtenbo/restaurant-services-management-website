package com.restaurant.service.impl;

import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.exception.BusinessException;
import com.restaurant.dto.request.table.CreateTableRequest;
import com.restaurant.dto.request.table.OpenTableRequest;
import com.restaurant.dto.request.table.UpdateTableRequest;
import com.restaurant.dto.response.table.TableLayoutResponse;
import com.restaurant.dto.response.table.TableResponse;
import com.restaurant.model.Table;
import com.restaurant.repository.OrderRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.service.table.TableService;
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
    private final OrderRepository orderRepository; // Chú ý: Đảm bảo OrderRepository có hàm existsByTableIdAndStatus

    // Helper: Tìm kiếm bàn hoặc quăng ngoại lệ nếu không tồn tại
    private Table findOrThrow(UUID id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bàn: " + id));
    }

    // Helper: Chuyển đổi dữ liệu từ Entity sang DTO Response
    private TableResponse toResponse(Table table) {
        return TableResponse.builder()
                .id(table.getId())
                .number(table.getNumber())
                .capacity(table.getCapacity())
                .status(table.getStatus().name()) // Chuyển đổi Enum thành dạng String cho DTO
                .isActive(table.getIsActive())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable) {
        // Xử lý các điều kiện Filter linh hoạt kết hợp khu vực và trạng thái bàn
        if (area != null && !area.isBlank() && status != null) {
            return tableRepository.findByIsActiveTrueAndAreaAndStatus(area, status, pageable).map(this::toResponse);
        } else if (area != null && !area.isBlank()) {
            return tableRepository.findByIsActiveTrueAndArea(area, pageable).map(this::toResponse);
        } else if (status != null) {
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
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        Table table = Table.builder()
                .number(request.getNumber())
                .capacity(request.getCapacity())
                .status(TableStatus.EMPTY) // Đảm bảo trạng thái ban đầu luôn trống
                .isActive(true)
                .build();

        Table savedTable = tableRepository.save(table);
        return toResponse(savedTable); // ĐÃ FIX: Bổ sung return DTO
    }

    @Override
    public TableResponse updateTable(UUID id, UpdateTableRequest request) {
        Table table = findOrThrow(id);

        // Kiểm tra xem số bàn mới có bị trùng với bàn khác không
        if (!table.getNumber().equals(request.getNumber())
                && tableRepository.existsByNumber(request.getNumber())) {
            throw new BusinessException("Số bàn '" + request.getNumber() + "' đã tồn tại");
        }

        table.setNumber(request.getNumber());
        table.setCapacity(request.getCapacity());

        Table updatedTable = tableRepository.save(table);
        return toResponse(updatedTable); // ĐÃ FIX: Bổ sung return DTO
    }

    @Override
    public void deleteTable(UUID id) {
        Table table = findOrThrow(id);

        if (table.getStatus() == TableStatus.SERVING) {
            throw new BusinessException("Không thể xóa bàn đang có khách");
        }

        table.setIsActive(false); // Xóa mềm dữ liệu bàn
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

        // Kiểm tra dưới bảng hóa đơn xem bàn này có hóa đơn nào chưa thanh toán không
        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Bàn đã có order đang mở");
        }

        table.setStatus(TableStatus.SERVING); // Kích hoạt đổi màu bàn
        tableRepository.save(table);
        
        // TODO: Ở đây bạn có thể bổ sung logic tạo bản ghi Order mới gắn với waiterId nếu cần thiết
        
        return toResponse(table);
    }

    @Override
    public TableResponse closeTable(UUID id) {
        Table table = findOrThrow(id);

        if (table.getStatus() != TableStatus.SERVING) {
            throw new BusinessException("Bàn không trong trạng thái SERVING");
        }

        // Chỉ cho phép đóng bàn khi toàn bộ hóa đơn đi kèm đã chuyển sang trạng thái PAID (hoặc không còn OPEN)
        if (orderRepository.existsByTableIdAndStatus(table.getId(), OrderStatus.OPEN)) {
            throw new BusinessException("Bàn vẫn còn hóa đơn chưa hoàn tất thanh toán, không thể dọn bàn!");
        }

        table.setStatus(TableStatus.EMPTY); // Đưa bàn về trạng thái trống sạch sẽ
        Table closedTable = tableRepository.save(table);
        return toResponse(closedTable); // ĐÃ FIX: Bổ sung return DTO
    }

    @Override
    @Transactional(readOnly = true)
    public TableLayoutResponse getLayout() {
        List<Table> all = tableRepository.findByIsActiveTrue();

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

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables(Integer capacity, LocalDateTime dateTime) {
        // Lọc ra các bàn trống phục vụ đặt chỗ dựa trên dung lượng số khách tối thiểu
        return tableRepository.findByIsActiveTrueAndStatus(TableStatus.EMPTY)
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