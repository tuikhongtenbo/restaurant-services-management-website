// frontend/src/types/reservation.ts

/** Trạng thái đặt bàn — match backend ReservationStatus enum */
export type ReservationStatus = 'PENDING' | 'REJECTED' | 'CONFIRMED' | 'ARRIVED' | 'NO_SHOW' | 'CANCELLED';

/**
 * Thông tin đặt bàn — match backend ReservationResponse DTO
 */
export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  note?: string;
  status: ReservationStatus;
  source?: string;
  tableId?: string;
  confirmedBy?: string;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: string;
}

/**
 * Response lịch đặt bàn theo ngày — match backend ReservationCalendarResponse DTO
 */
export interface ReservationCalendar {
  date: string;
  reservations: Reservation[];
  totalReservations: number;
  pending: number;
  confirmed: number;
  arrived: number;
  cancelled: number;
}

/**
 * Request tạo đặt bàn — match backend CreateReservationRequest DTO
 */
export interface CreateReservationRequest {
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  note?: string;
}

/**
 * Request cập nhật đặt bàn — match backend UpdateReservationRequest DTO
 */
export interface UpdateReservationRequest {
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  note?: string;
}

/**
 * Request hủy đặt bàn — match backend CancelReservationRequest DTO
 */
export interface CancelReservationRequest {
  reason: string;
}
