import { API_ENDPOINTS } from "../config/api";
import { ApiClient, getAuthHeaders } from "../utils/apiClient";

export interface ReservationRequest {
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  note?: string;
}

export interface ReservationResponse {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedAt: string;
  note?: string;
  status: string;
  createdAt: string;
  tableId?: string;
}

export interface ReservationCalendarResponse {
  date: string;
  reservations: ReservationResponse[];
  totalReservations: number;
  pending: number;
  confirmed: number;
  arrived: number;
  cancelled: number;
}

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const reservationService = {
  async createReservation(
    data: ReservationRequest,
  ): Promise<ReservationResponse> {
    try {
      const response = await ApiClient.post<ReservationResponse>(
        API_ENDPOINTS.RESERVATION.CREATE,
        data,
        getAuthHeaders(),
      );
      return response;
    } catch (error) {
      console.error("Reservation Service Error:", error);
      throw error;
    }
  },

  async getReservations(date?: string): Promise<ReservationResponse[]> {
    try {
      let url = API_ENDPOINTS.RESERVATION.GET_ALL;
      if (date) {
        url += `?date=${date}`;
      }
      const response = await ApiClient.get<PageResponse<ReservationResponse>>(
        url,
        getAuthHeaders(),
      );
      return response?.content || [];
    } catch (error) {
      console.error("Get Reservations Error:", error);
      throw error;
    }
  },

  async getReservationById(id: string): Promise<ReservationResponse> {
    try {
      const response = await ApiClient.get<ReservationResponse>(
        API_ENDPOINTS.RESERVATION.GET_BY_ID(id),
        getAuthHeaders(),
      );
      return response;
    } catch (error) {
      console.error("Get Reservation Error:", error);
      throw error;
    }
  },

  async cancelReservation(id: string, reason?: string): Promise<void> {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const staffId = localStorage.getItem("staffId");
      if (staffId) {
        headers["X-Staff-ID"] = staffId;
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(API_ENDPOINTS.RESERVATION.CANCEL(id), {
        method: "PUT",
        headers,
        body: JSON.stringify({ reason: reason || "Đã hủy bởi nhân viên" }),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi huỷ đặt bàn");
      }
    } catch (error) {
      console.error("Cancel Reservation Error:", error);
      throw error;
    }
  },

  async rejectReservation(id: string, reason: string): Promise<void> {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const staffId = localStorage.getItem("staffId");
      if (staffId) {
        headers["X-Staff-ID"] = staffId;
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(API_ENDPOINTS.RESERVATION.REJECT(id), {
        method: "PUT",
        headers,
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Lỗi khi từ chối đặt bàn");
      }
    } catch (error) {
      console.error("Reject Reservation Error:", error);
      throw error;
    }
  },

  async arrivedReservation(id: string): Promise<void> {
    try {
      await ApiClient.put<void>(
        API_ENDPOINTS.RESERVATION.ARRIVED(id),
        {},
        getAuthHeaders(),
      );
    } catch (error) {
      console.error("Arrived Reservation Error:", error);
      throw error;
    }
  },

  async noShowReservation(id: string): Promise<void> {
    try {
      await ApiClient.put<void>(
        API_ENDPOINTS.RESERVATION.NO_SHOW(id),
        {},
        getAuthHeaders(),
      );
    } catch (error) {
      console.error("No Show Reservation Error:", error);
      throw error;
    }
  },

  async getAvailableDates(partySize: number): Promise<string[]> {
    try {
      // It's a public endpoint, so no auth headers needed technically, but getAuthHeaders handles token if exists.
      const response = await ApiClient.get<string[]>(
        `${API_ENDPOINTS.RESERVATION.AVAILABLE_DATES}?partySize=${partySize}`,
        getAuthHeaders(),
      );
      return response || [];
    } catch (error) {
      console.error("Get Available Dates Error:", error);
      return [];
    }
  },

  async getAvailableTimes(date: string, partySize: number): Promise<string[]> {
    try {
      const response = await ApiClient.get<string[]>(
        `${API_ENDPOINTS.RESERVATION.AVAILABLE_TIMES}?date=${date}&partySize=${partySize}`,
        getAuthHeaders(),
      );
      return response || [];
    } catch (error) {
      console.error("Get Available Times Error:", error);
      return [];
    }
  },

  async confirmReservation(id: string, staffId: string, tableId: string): Promise<ReservationResponse> {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Staff-ID": staffId,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(API_ENDPOINTS.RESERVATION.CONFIRM(id), {
        method: "PUT",
        headers,
        body: JSON.stringify({ tableId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // Backend có thể wrap trong { status, message, data } hoặc trả thẳng
      return (data.data ?? data) as ReservationResponse;
    } catch (error) {
      console.error("Confirm Reservation Error:", error);
      throw error;
    }
  },

  async getCalendar(date: string): Promise<ReservationCalendarResponse> {
    try {
      const response = await ApiClient.get<ReservationCalendarResponse>(
        `${API_ENDPOINTS.RESERVATION.CALENDAR}?date=${date}`,
        getAuthHeaders(),
      );
      return response;
    } catch (error) {
      console.error("Get Calendar Error:", error);
      throw error;
    }
  },
};
