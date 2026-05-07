package com.restaurant.repository;

// THY
// TODO: JpaRepository<Reservation, UUID>
// Custom queries:
//   - List<Reservation> findByReservedAtBetween(LocalDateTime from, LocalDateTime to)
//   - List<Reservation> findByStatus(ReservationStatus status)
//   - List<Reservation> findByCustomerPhone(String phone)
//   - List<Reservation> findByReservedAtBetweenAndStatus(LocalDateTime from, LocalDateTime to, ReservationStatus status)
//   - @Query: tim cac reservation con pending sau 30 phut (auto-cancel)
