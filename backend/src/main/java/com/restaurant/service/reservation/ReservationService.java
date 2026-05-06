package com.restaurant.service.reservation;

// THY
// TODO: @Service
// Methods:
//   Page<ReservationResponse> getReservations(LocalDate date, ReservationStatus status, Pageable pageable)
//   ReservationResponse getById(UUID id)
//   ReservationResponse create(CreateReservationRequest request, UUID staffId)
//   ReservationResponse update(UUID id, UpdateReservationRequest request)
//   ReservationResponse confirm(UUID id, UUID confirmedBy)
//   ReservationResponse arrived(UUID id) → auto open table
//   ReservationResponse noShow(UUID id)
//   ReservationResponse cancel(UUID id, UUID cancelledBy, String reason)
//   void autoCancelExpired() → @Scheduled, chay moi phut
//   List<AvailableSlot> getAvailableSlots(LocalDate date, Integer partySize)
//   TableResponse suggestTable(Integer partySize, LocalDateTime dateTime)
//   ReservationCalendarResponse getCalendar(LocalDate date)
public interface ReservationService {
}
