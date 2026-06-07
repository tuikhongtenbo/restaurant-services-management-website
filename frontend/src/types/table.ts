// frontend/src/types/table.ts

/** Trạng thái bàn — match backend TableStatus enum */
export type TableStatus = 'EMPTY' | 'SERVING' | 'RESERVED' | 'CLEANING';

/**
 * Thông tin bàn — match backend TableResponse DTO
 */
export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  area: string;
  isActive: boolean;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * Request tạo bàn mới — match backend CreateTableRequest DTO
 */
export interface CreateTableRequest {
  number: string;
  capacity: number;
  area: string;
}

/**
 * Request cập nhật bàn — match backend UpdateTableRequest DTO
 */
export interface UpdateTableRequest {
  number: string;
  capacity: number;
  area?: string;
}

/**
 * Request mở bàn — match backend OpenTableRequest DTO
 */
export interface OpenTableRequest {
  partySize: number;
  note?: string;
}

/**
 * Response sơ đồ bàn theo khu vực — match backend TableLayoutResponse DTO
 */
export interface TableLayoutResponse {
  areas: Record<string, Table[]>;
}
