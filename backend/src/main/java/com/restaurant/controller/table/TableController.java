package com.restaurant.controller.table;

import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.utils.ApiResponse;
import com.restaurant.dto.request.table.CreateTableRequest;
import com.restaurant.dto.request.table.OpenTableRequest;
import com.restaurant.dto.request.table.UpdateTableRequest;
import com.restaurant.dto.response.table.TableLayoutResponse;
import com.restaurant.dto.response.table.TableResponse;
import com.restaurant.security.CustomUserDetails;
import com.restaurant.service.table.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<TableResponse>>> getAllTables(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) TableStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getTables(area, status, pageable)));
    }

    @GetMapping("/layout")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableLayoutResponse>> getTableLayout() {
        return ResponseEntity.ok(ApiResponse.success(tableService.getLayout()));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables(
            @RequestParam Integer capacity,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTime) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getAvailableTables(capacity, dateTime)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tableService.getTableById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(@Valid @RequestBody CreateTableRequest request) {
        return ResponseEntity.ok(ApiResponse.success(tableService.createTable(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<TableResponse>> updateTable(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTableRequest request) {
        return ResponseEntity.ok(ApiResponse.success(tableService.updateTable(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable UUID id) {
        tableService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/open")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableResponse>> openTable(
            @PathVariable UUID id,
            @RequestBody OpenTableRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID waiterId = userDetails.getId();
        return ResponseEntity.ok(ApiResponse.success(tableService.openTable(id, request, waiterId)));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TableResponse>> closeTable(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tableService.closeTable(id)));
    }
}
