package com.restaurant.controller.table;

import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.table.CreateTableRequest;
import com.restaurant.dto.request.table.OpenTableRequest;
import com.restaurant.dto.request.table.UpdateTableRequest;
import com.restaurant.dto.response.table.TableResponse;
import com.restaurant.dto.response.table.TableLayoutResponse;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.service.table.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    // 1. GET /
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<TableResponse>>> getAllTables(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) TableStatus status,
            Pageable pageable) {
        
        // Gọi đúng getTables của interface
        Page<TableResponse> tables = tableService.getTables(area, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(tables));
    }

    // 2. GET /layout
    @GetMapping("/layout")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableLayoutResponse>> getTableLayout() {
        // Gọi đúng getLayout của interface
        TableLayoutResponse layout = tableService.getLayout();
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    // 3. GET /available
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables(
            @RequestParam Integer capacity,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTime) {
        
        List<TableResponse> availableTables = tableService.getAvailableTables(capacity, dateTime);
        return ResponseEntity.ok(ApiResponse.success(availableTables));
    }

    // 4. GET /{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable UUID id) {
        TableResponse table = tableService.getTableById(id);
        return ResponseEntity.ok(ApiResponse.success(table));
    }

    // 5. POST /
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(@RequestBody CreateTableRequest request) {
        TableResponse createdTable = tableService.createTable(request);
        return ResponseEntity.ok(ApiResponse.success(createdTable));
    }

    // 6. PUT /{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> updateTable(
            @PathVariable UUID id, 
            @RequestBody UpdateTableRequest request) {
     
        TableResponse updatedTable = tableService.updateTable(id, request);
        return ResponseEntity.ok(ApiResponse.success(updatedTable));
    }

    // 7. DELETE /{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable UUID id) {

        tableService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // 8. POST /{id}/open
    @PostMapping("/{id}/open")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableResponse>> openTable(
            @PathVariable UUID id,
            @RequestBody OpenTableRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Mẹo ép kiểu/lấy UUID: Nếu trong CustomUserDetails của bạn đã có sẵn trường id dạng UUID:
        // Ví dụ: UUID waiterId = ((CustomUserDetails) userDetails).getId();
        // Dưới đây mình giả lập một hàm lấy UUID để khớp với param `UUID waiterId` của bạn:
        UUID waiterId = getWaiterIdFromUserDetails(userDetails); 
        
        // Khớp 100% với: openTable(UUID id, OpenTableRequest request, UUID waiterId)
        TableResponse openedTable = tableService.openTable(id, request, waiterId);
        return ResponseEntity.ok(ApiResponse.success(openedTable));
    }

    // 9. POST /{id}/close
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableResponse>> closeTable(@PathVariable UUID id) {
        // Gọi đúng closeTable của interface (chỉ cần nhận mỗi id bàn)
        TableResponse closedTable = tableService.closeTable(id);
        return ResponseEntity.ok(ApiResponse.success(closedTable));
    }

    /**
     * Hàm helper giả định để bóc tách UUID từ hệ thống Auth của bạn.
     * Bạn hãy sửa lại dòng này cho đúng với Class triển khai UserDetails trong dự án nhé.
     */
    private UUID getWaiterIdFromUserDetails(UserDetails userDetails) {
        // Ví dụ nếu bạn dùng CustomUserDetails triển khai UserDetails:
        // return ((CustomUserDetails) userDetails).getId();
        
        // Tạm thời trả về ngẫu nhiên hoặc bóc từ username ra nếu bạn lưu chuỗi UUID trong username
        return UUID.fromString(userDetails.getUsername()); 
    }
}