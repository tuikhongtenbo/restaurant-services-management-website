package com.restaurant.service.table;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.dto.request.table.CreateTableRequest;
import com.restaurant.dto.request.table.OpenTableRequest;
import com.restaurant.dto.request.table.UpdateTableRequest;
import com.restaurant.dto.response.table.TableLayoutResponse;
import com.restaurant.dto.response.table.TableResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


// THY
// TODO: @Service
// Methods:
//   Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable)
//   TableResponse getTableById(UUID id)
//   TableResponse createTable(CreateTableRequest request)
//   TableResponse updateTable(UUID id, UpdateTableRequest request)
//   void deleteTable(UUID id) → isActive = false
//   TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId)
//   TableResponse closeTable(UUID id) → chi khi order da paid
//   TableLayoutResponse getLayout()
//   List<TableResponse> getAvailableTables(Integer capacity, LocalDateTime dateTime)
public interface TableService {
    Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable);  
    TableResponse getTableById(UUID id);
    TableResponse createTable(CreateTableRequest request);
    TableResponse updateTable(UUID id, UpdateTableRequest request);
    void deleteTable(UUID id);
    TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId);
    TableResponse closeTable(UUID id);
    TableLayoutResponse getLayout();
    List<TableResponse> getAvailableTables(Integer capacity, LocalDateTime dateTime);
}
