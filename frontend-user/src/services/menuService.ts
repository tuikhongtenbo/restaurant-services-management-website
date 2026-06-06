import type { MenuItem } from "../types/menu";
import { API_ENDPOINTS } from "../config/api";
import { ApiClient } from "../utils/apiClient";
import { MOCK_MENU_DATA } from "./mockMenu";

// Response thực tế từ /api/public/menu:
// { data: MenuItem[] (flat array), status: 200, message: "..." }
// Mỗi item có: id, category, name, description, image_url (snake_case), price, promo_price, status
interface BackendMenuItemFlat {
  id: string;
  category: string;
  name: string;
  description?: string;
  image_url?: string;    // snake_case từ backend
  imageUrl?: string;     // camelCase fallback
  price: number;
  promo_price?: number | null;  // snake_case từ backend
  promoPrice?: number | null;   // camelCase fallback
  status?: string;
  tags?: string;
  sortOrder?: number;
}

interface FlatMenuApiResponse {
  data: BackendMenuItemFlat[];
  status: number;
  message: string;
}

function mapFlatItem(item: BackendMenuItemFlat): MenuItem {
  return {
    id: String(item.id),
    name: item.name ?? "",
    description: item.description ?? "",
    category: item.category ?? "",
    imageUrl: item.imageUrl ?? item.image_url,
    image_url: item.image_url ?? item.imageUrl,
    price: Number(item.price) || 0,
    promoPrice: item.promoPrice ?? item.promo_price ?? null,
    promo_price: item.promo_price ?? item.promoPrice ?? null,
    status: item.status,
  };
}

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await ApiClient.get<FlatMenuApiResponse>(API_ENDPOINTS.MENU.GET_ALL);

    // API trả về có thể là flat array hoặc group array (theo category)
    // Dựa vào cấu trúc Swagger: data = [ { category: "Do_uong", items: [ ... ] }, ... ]
    let items = response?.data;
    let flatItems: any[] = [];

    if (Array.isArray(items) && items.length > 0) {
      // Kiểm tra xem đây là array of categories hay array of items
      const firstItem = items[0] as any;
      if (firstItem.items && Array.isArray(firstItem.items)) {
        // Flatten array
        for (const group of items as any[]) {
          flatItems = [...flatItems, ...group.items];
        }
      } else {
        flatItems = items;
      }
      
      if (flatItems.length > 0) {
        return flatItems.map(mapFlatItem);
      }
    }

    // Fallback mock nếu API trả rỗng
    console.warn("Menu API trả về rỗng, dùng mock data");
    return MOCK_MENU_DATA;
  } catch (error) {
    console.error("Menu API lỗi:", error);
    // Fallback mock nếu API fail
    return MOCK_MENU_DATA;
  }
};

export const fetchMenuById = async (id: string): Promise<MenuItem | null> => {
  try {
    const response = await ApiClient.get<{ data: BackendMenuItemFlat }>(
      API_ENDPOINTS.MENU.GET_BY_ID(id),
    );
    const item = response?.data;
    return item ? mapFlatItem(item) : null;
  } catch (error) {
    console.error("Menu Item Service Error:", error);
    return null;
  }
};
