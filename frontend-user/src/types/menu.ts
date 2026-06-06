// Các category từ backend: tên thật từ DB (Mon_chinh, Khai_vi, Do_uong, ...)
export type Category = string;

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  promoPrice?: number | null;    // camelCase từ backend
  promo_price?: number | null;   // snake_case legacy (mock data)
  description: string;
  category: Category;
  imageUrl?: string;             // camelCase từ backend
  image_url?: string;            // snake_case legacy
  status?: string;               // AVAILABLE, UNAVAILABLE, ...
}
