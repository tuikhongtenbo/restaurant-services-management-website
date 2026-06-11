// frontend/src/services/reservation.service.ts
import { apiClient } from "@/lib/api-client";
import { ApiResponse, PaginatedData } from "@/types/common";
import {
  Reservation,
  ReservationStatus,
  ReservationCalendar,
  CreateReservationRequest,
  UpdateReservationRequest,
  CancelReservationRequest,
} from "@/types/reservation";

export const reservationService = {
  /**
   * GET /api/reservations
   * Lấy danh sách đặt bàn, hỗ trợ filter theo ngày và trạng thái
   */
  async getReservations(params?: {
    date?: string;
    status?: ReservationStatus;
    page?: number;
    size?: number;
  }): Promise<PaginatedData<Reservation>> {
    const query = new URLSearchParams();
    if (params?.date) query.append("date", params.date);
    if (params?.status) query.append("status", params.status);
    if (params?.page !== undefined) query.append("page", String(params.page));
    if (params?.size !== undefined) query.append("size", String(params.size));
    const queryStr = query.toString();
    const endpoint = queryStr ? `/reservations?${queryStr}` : `/reservations`;

    // Controller trả về Page<ReservationResponse> trực tiếp (không bọc ApiResponse)
    return apiClient<PaginatedData<Reservation>>(endpoint, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/reservations/calendar?date={date}
   * Lấy lịch đặt bàn theo ngày (tổng hợp số lượng theo trạng thái)
   */
  async getCalendar(date: string): Promise<ReservationCalendar> {
    // Controller trả về ReservationCalendarResponse trực tiếp (không bọc ApiResponse)
    return apiClient<ReservationCalendar>(`/reservations/calendar?date=${date}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * GET /api/reservations/{id}
   * Lấy chi tiết một đặt bàn theo id
   */
  async getReservationById(id: string): Promise<Reservation> {
    // Controller trả về ReservationResponse trực tiếp
    return apiClient<Reservation>(`/reservations/${id}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * POST /api/reservations
   * Tạo đặt bàn mới (có thể kèm X-Staff-ID header nếu nhân viên tạo)
   */
  async createReservation(data: CreateReservationRequest, staffId?: string): Promise<Reservation> {
    const headers: Record<string, string> = {};
    if (staffId) headers["X-Staff-ID"] = staffId;

    return apiClient<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
      requireAuth: true,
    });
  },

  /**
   * PUT /api/reservations/{id}
   * Cập nhật thông tin đặt bàn
   */
  async updateReservation(id: string, data: UpdateReservationRequest): Promise<Reservation> {
    return apiClient<Reservation>(`/reservations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  /**
   * PUT /api/reservations/{id}/confirm
   * Xác nhận đặt bàn (kèm X-Staff-ID header)
   */
  async confirmReservation(id: string, staffId: string): Promise<Reservation> {
    return apiClient<Reservation>(`/reservations/${id}/confirm`, {
      method: "PUT",
      headers: { "X-Staff-ID": staffId },
      requireAuth: true,
    });
  },

  /**
   * PUT /api/reservations/{id}/arrived
   * Đánh dấu khách đã đến
   */
  async markAsArrived(id: string): Promise<Reservation> {
    return apiClient<Reservation>(`/reservations/${id}/arrived`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/reservations/{id}/no-show
   * Đánh dấu khách không đến
   */
  async markAsNoShow(id: string): Promise<Reservation> {
    return apiClient<Reservation>(`/reservations/${id}/no-show`, {
      method: "PUT",
      requireAuth: true,
    });
  },

  /**
   * PUT /api/reservations/{id}/cancel
   * Hủy đặt bàn kèm lý do (có thể kèm X-Staff-ID header)
   */
  async cancelReservation(
    id: string,
    data: CancelReservationRequest,
    staffId?: string
  ): Promise<Reservation> {
    const headers: Record<string, string> = {};
    if (staffId) headers["X-Staff-ID"] = staffId;

    return apiClient<Reservation>(`/reservations/${id}/cancel`, {
      method: "PUT",
      body: JSON.stringify(data),
      headers,
      requireAuth: true,
    });
  },

  /**
   * GET /api/reservations/available-slots?date={date}&partySize={partySize}
   * Lấy danh sách giờ còn trống trong ngày cho số lượng khách
   */
  async getAvailableSlots(date: string, partySize: number): Promise<string[]> {
    const query = new URLSearchParams({ date, partySize: String(partySize) }).toString();
    // Controller trả về List<LocalTime> trực tiếp
    return apiClient<string[]>(`/reservations/available-slots?${query}`, {
      method: "GET",
      requireAuth: true,
    });
  },

  /**
   * DELETE /api/reservations/{id}
   * Xóa đặt bàn
   */
  async deleteReservation(id: string): Promise<void> {
    return apiClient<void>(`/reservations/${id}`, {
      method: "DELETE",
      requireAuth: true,
    });
  },
};
