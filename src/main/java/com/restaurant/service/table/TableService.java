package com.restaurant.service.table;

// THANG
// TODO: @Service
// Methods:
//   Page<TableResponse> getTables(String area, TableStatus status, Pageable pageable)
//   TableResponse getTableById(UUID id)
//   TableResponse createTable(CreateTableRequest request)
//   TableResponse updateTable(UUID id, UpdateTableRequest request)
//   TableResponse updatePosition(UUID id, Integer posX, Integer posY)
//   void deleteTable(UUID id) → isActive = false
//   TableResponse openTable(UUID id, OpenTableRequest request, UUID waiterId)
//   TableResponse closeTable(UUID id) → chi khi order da paid
//   TableLayoutResponse getLayout()
//   List<TableResponse> getAvailableTables(Integer capacity, LocalDateTime dateTime)
public interface TableService {
}
