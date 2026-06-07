// frontend/src/types/table.ts
export type TableStatus = 'EMPTY' | 'SERVING' | 'RESERVED' | 'CLEANING';

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  area: string;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateTableRequest {
  tableNumber: string;
  capacity: number;
  area: string;
}

export interface TableLayoutResponse {
  // Tuỳ thuộc vào backend trả về gì (ví dụ: Map các khu vực)
  areas: Record<string, Table[]>;
}
