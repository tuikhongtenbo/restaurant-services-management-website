// frontend/src/types/common.ts

/**
 * Response chuẩn từ backend — bọc trong ApiResponse<T>
 * Dùng cho hầu hết các endpoint trả về qua ApiResponse.success(...)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
}

/**
 * Dữ liệu phân trang chuẩn Spring Page<T>
 * Dùng cho các endpoint trả về Page<T> (menu items, users, vouchers, reservations...)
 */
export interface PaginatedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Response phân trang custom — match với backend PageResponse record
 * Dùng cho các endpoint orders, invoices (format khác Page<T>)
 */
export interface PageResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
