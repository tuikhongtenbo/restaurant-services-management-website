// frontend/src/types/menu.ts

/** Trạng thái món ăn — match backend MenuItemStatus enum */
export type MenuItemStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

/**
 * Thông tin món ăn — match backend MenuItemResponse DTO
 */
export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  tags?: string;
  status: MenuItemStatus;
  sortOrder?: number;
  createdAt: string;
  deletedAt?: string;
}

/**
 * Request tạo món ăn — match backend CreateMenuItemRequest DTO
 */
export interface CreateMenuItemRequest {
  name: string;
  category: string;
  description?: string;
  imageUrl: string;
  price: number;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  tags?: string;
  sortOrder?: number;
}

/**
 * Request cập nhật món ăn — match backend UpdateMenuItemRequest DTO
 */
export interface UpdateMenuItemRequest {
  name?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  status?: MenuItemStatus;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  tags?: string;
  sortOrder?: number;
}

/**
 * Một mục trong lịch sử giá
 */
export interface PriceHistoryItem {
  price: number;
  changedAt: string;
  changedBy: string;
}

/**
 * Response lịch sử giá — match backend PriceHistoryResponse DTO
 */
export interface PriceHistoryResponse {
  itemId: string;
  itemName: string;
  history: PriceHistoryItem[];
}
