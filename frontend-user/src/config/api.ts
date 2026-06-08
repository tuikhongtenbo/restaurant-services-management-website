// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  // Authentication (Customer endpoints - public)
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/customer/login`,
    STAFF_LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/customer/register`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
  },
  // Menu (public endpoint)
  MENU: {
    GET_ALL: `${API_BASE_URL}/api/public/menu`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/public/menu/${id}`,
  },
  // Reservation (public endpoint cho customer đặt bàn trước)
  RESERVATION: {
    CREATE: `${API_BASE_URL}/api/public/reservations`,
    GET_ALL: `${API_BASE_URL}/api/reservations`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/reservations/${id}`,
    CANCEL: (id: string) => `${API_BASE_URL}/api/reservations/${id}/cancel`,
    REJECT: (id: string) => `${API_BASE_URL}/api/reservations/${id}/reject`,
    ARRIVED: (id: string) => `${API_BASE_URL}/api/reservations/${id}/arrived`,
    NO_SHOW: (id: string) => `${API_BASE_URL}/api/reservations/${id}/no-show`,
    AVAILABLE_DATES: `${API_BASE_URL}/api/public/reservations/available-dates`,
    AVAILABLE_TIMES: `${API_BASE_URL}/api/public/reservations/available-times`,
    CONFIRM: (id: string) => `${API_BASE_URL}/api/reservations/${id}/confirm`,
    CALENDAR: `${API_BASE_URL}/api/reservations/calendar`,
  },
  // Tables (staff only)
  TABLES: {
    GET_ALL: `${API_BASE_URL}/api/tables`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/tables/${id}`,
    OPEN: (id: string) => `${API_BASE_URL}/api/tables/${id}/open`,
    CLOSE: (id: string) => `${API_BASE_URL}/api/tables/${id}/close`,
  },
  // Orders (staff only)
  ORDERS: {
    CREATE: `${API_BASE_URL}/api/orders`,
    GET_ALL: `${API_BASE_URL}/api/orders`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
    GET_BY_TABLE: (tableId: string) => `${API_BASE_URL}/api/orders/table/${tableId}`,
    ADD_ITEM: (orderId: string) => `${API_BASE_URL}/api/orders/${orderId}/items`,
    UPDATE_ITEM: (orderId: string, itemId: string) => `${API_BASE_URL}/api/orders/${orderId}/items/${itemId}`,
    CLOSE: (orderId: string) => `${API_BASE_URL}/api/orders/${orderId}/status/close`,
  },
  // Order (general)
  ORDER: {
    CREATE: `${API_BASE_URL}/api/orders`,
    GET_ALL: `${API_BASE_URL}/api/orders`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
  },
  PAYMENT: {
    CHECKOUT: `${API_BASE_URL}/api/payments/checkout`,
    CASH: `${API_BASE_URL}/api/payments/cash`,
    VNPAY_CREATE: `${API_BASE_URL}/api/payments/vnpay/create`,
  },
  INVOICE: {
    GET_ALL: `${API_BASE_URL}/api/payments/invoices`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/payments/invoices/${id}`,
    PRINT: (id: string) => `${API_BASE_URL}/api/invoices/${id}/print`,
  },
};

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    "Content-Type": "application/json",
  },
};
