// Mock data cho toàn bộ Admin Dashboard
// Sử dụng cho tất cả các trang khi chưa có API thực

export type OrderStatus = "PENDING" | "SERVING" | "PAID" | "VOIDED" | "CANCELLED";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING";
export type StaffRole = "ADMIN" | "MANAGER" | "CASHIER" | "WAITER" | "CHEF";
export type VoucherStatus = "ACTIVE" | "EXPIRED" | "USED";

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────
export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  waiter: string;
  createdAt: string;
  paidAt?: string;
}

export const mockOrders: Order[] = [
  { id: "o1", orderNumber: "ORD-0081", tableNumber: 3, items: [{ name: "Bò lúc lắc", qty: 1, price: 189000 }, { name: "Nước cam ép", qty: 2, price: 45000 }], total: 279000, status: "PAID", waiter: "Nguyễn Văn A", createdAt: "2025-05-29T08:12:00Z", paidAt: "2025-05-29T09:05:00Z" },
  { id: "o2", orderNumber: "ORD-0082", tableNumber: 7, items: [{ name: "Gà nướng sa tế", qty: 2, price: 165000 }, { name: "Bia Heineken", qty: 3, price: 35000 }], total: 435000, status: "SERVING", waiter: "Trần Thị B", createdAt: "2025-05-29T08:45:00Z" },
  { id: "o3", orderNumber: "ORD-0083", tableNumber: 1, items: [{ name: "Phở bò đặc biệt", qty: 2, price: 95000 }], total: 190000, status: "PENDING", waiter: "Lê Văn C", createdAt: "2025-05-29T09:10:00Z" },
  { id: "o4", orderNumber: "ORD-0084", tableNumber: 5, items: [{ name: "Cơm tấm sườn bì", qty: 3, price: 85000 }, { name: "Trà đào", qty: 3, price: 35000 }], total: 360000, status: "PAID", waiter: "Nguyễn Văn A", createdAt: "2025-05-29T07:30:00Z", paidAt: "2025-05-29T08:20:00Z" },
  { id: "o5", orderNumber: "ORD-0085", tableNumber: 9, items: [{ name: "Sườn xào chua ngọt", qty: 1, price: 145000 }, { name: "Canh chua cá", qty: 1, price: 75000 }], total: 220000, status: "SERVING", waiter: "Phạm Thị D", createdAt: "2025-05-29T09:30:00Z" },
  { id: "o6", orderNumber: "ORD-0086", tableNumber: 2, items: [{ name: "Lẩu thái hải sản", qty: 1, price: 350000 }], total: 350000, status: "SERVING", waiter: "Trần Thị B", createdAt: "2025-05-29T09:15:00Z" },
  { id: "o7", orderNumber: "ORD-0087", tableNumber: 11, items: [{ name: "Bún bò Huế", qty: 2, price: 85000 }], total: 170000, status: "PAID", waiter: "Lê Văn C", createdAt: "2025-05-29T07:00:00Z", paidAt: "2025-05-29T07:50:00Z" },
  { id: "o8", orderNumber: "ORD-0088", tableNumber: 6, items: [{ name: "Ốc hương xào bơ tỏi", qty: 2, price: 185000 }], total: 370000, status: "VOIDED", waiter: "Phạm Thị D", createdAt: "2025-05-29T08:00:00Z" },
  { id: "o9", orderNumber: "ORD-0089", tableNumber: 4, items: [{ name: "Salad cá hồi", qty: 1, price: 125000 }, { name: "Pasta carbonara", qty: 1, price: 155000 }, { name: "Cappuccino", qty: 2, price: 65000 }], total: 410000, status: "PENDING", waiter: "Nguyễn Văn A", createdAt: "2025-05-29T09:45:00Z" },
  { id: "o10", orderNumber: "ORD-0090", tableNumber: 8, items: [{ name: "Steak bò Mỹ 300g", qty: 2, price: 450000 }, { name: "Rượu vang đỏ", qty: 1, price: 850000 }], total: 1750000, status: "SERVING", waiter: "Trần Thị B", createdAt: "2025-05-29T09:00:00Z" },
];

// ─────────────────────────────────────────
// MENU ITEMS
// ─────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  isAvailable: boolean;
  isPopular: boolean;
  soldCount: number;
}

export const mockMenuItems: MenuItem[] = [
  { id: "m1", name: "Bò lúc lắc", category: "Món chính", price: 189000, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80", description: "Bò Mỹ xào lúc lắc với ớt chuông, hành tây", isAvailable: true, isPopular: true, soldCount: 342 },
  { id: "m2", name: "Gà nướng sa tế", category: "Món chính", price: 165000, image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=300&q=80", description: "Nửa con gà nướng sa tế đặc trưng", isAvailable: true, isPopular: true, soldCount: 289 },
  { id: "m3", name: "Phở bò đặc biệt", category: "Món chính", price: 95000, image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&q=80", description: "Phở bò tái chín với nước dùng hầm 8 tiếng", isAvailable: true, isPopular: true, soldCount: 512 },
  { id: "m4", name: "Cơm tấm sườn bì", category: "Món chính", price: 85000, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80", description: "Cơm tấm sườn bì chả, kèm nước mắm chua ngọt", isAvailable: true, isPopular: false, soldCount: 198 },
  { id: "m5", name: "Lẩu thái hải sản", category: "Món chính", price: 350000, image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80", description: "Lẩu thái chua cay với tôm, mực, nghêu tươi", isAvailable: true, isPopular: true, soldCount: 156 },
  { id: "m6", name: "Salad cá hồi", category: "Khai vị", price: 125000, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80", description: "Cá hồi Na Uy với rau trộn và sốt mè", isAvailable: true, isPopular: false, soldCount: 87 },
  { id: "m7", name: "Nước cam ép", category: "Đồ uống", price: 45000, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&q=80", description: "Cam tươi ép nguyên chất", isAvailable: true, isPopular: false, soldCount: 421 },
  { id: "m8", name: "Cappuccino", category: "Đồ uống", price: 65000, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80", description: "Cà phê Ý với bọt sữa mịn", isAvailable: true, isPopular: false, soldCount: 234 },
  { id: "m9", name: "Bánh flan caramel", category: "Tráng miệng", price: 55000, image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80", description: "Bánh flan mềm mịn với sốt caramel", isAvailable: true, isPopular: false, soldCount: 143 },
  { id: "m10", name: "Bia Heineken", category: "Đồ uống", price: 35000, image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&q=80", description: "Bia Heineken lon 330ml", isAvailable: true, isPopular: false, soldCount: 678 },
  { id: "m11", name: "Pasta carbonara", category: "Món chính", price: 155000, image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&q=80", description: "Pasta kem bacon kiểu Ý truyền thống", isAvailable: false, isPopular: false, soldCount: 95 },
  { id: "m12", name: "Steak bò Mỹ 300g", category: "Món chính", price: 450000, image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=300&q=80", description: "Bò Mỹ ribeye 300g nướng theo yêu cầu", isAvailable: true, isPopular: true, soldCount: 201 },
];

// ─────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────
export interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  area: string;
  status: TableStatus;
  currentOrder?: string;
  occupiedSince?: string;
  reservedFor?: string;
}

export const mockTables: RestaurantTable[] = [
  { id: "t1", number: 1, capacity: 2, area: "Trong nhà", status: "OCCUPIED", currentOrder: "ORD-0083", occupiedSince: "09:10" },
  { id: "t2", number: 2, capacity: 4, area: "Trong nhà", status: "OCCUPIED", currentOrder: "ORD-0086", occupiedSince: "09:15" },
  { id: "t3", number: 3, capacity: 4, area: "Trong nhà", status: "AVAILABLE" },
  { id: "t4", number: 4, capacity: 4, area: "Trong nhà", status: "OCCUPIED", currentOrder: "ORD-0089", occupiedSince: "09:45" },
  { id: "t5", number: 5, capacity: 6, area: "Trong nhà", status: "AVAILABLE" },
  { id: "t6", number: 6, capacity: 2, area: "Trong nhà", status: "CLEANING" },
  { id: "t7", number: 7, capacity: 6, area: "Trong nhà", status: "OCCUPIED", currentOrder: "ORD-0082", occupiedSince: "08:45" },
  { id: "t8", number: 8, capacity: 8, area: "VIP", status: "OCCUPIED", currentOrder: "ORD-0090", occupiedSince: "09:00" },
  { id: "t9", number: 9, capacity: 4, area: "Ngoài trời", status: "OCCUPIED", currentOrder: "ORD-0085", occupiedSince: "09:30" },
  { id: "t10", number: 10, capacity: 4, area: "Ngoài trời", status: "RESERVED", reservedFor: "Nguyễn Gia Đình - 11:30" },
  { id: "t11", number: 11, capacity: 2, area: "Ngoài trời", status: "AVAILABLE" },
  { id: "t12", number: 12, capacity: 6, area: "Ngoài trời", status: "AVAILABLE" },
];

// ─────────────────────────────────────────
// STAFF
// ─────────────────────────────────────────
export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  avatar: string;
  shift: string;
  status: "ACTIVE" | "OFF" | "ON_LEAVE";
  joinDate: string;
  ordersHandled: number;
}

export const mockStaff: Staff[] = [
  { id: "s1", name: "Trần Minh Quân", role: "ADMIN", email: "quan.tran@restaurant.com", phone: "0901234567", avatar: "Q", shift: "Toàn thời gian", status: "ACTIVE", joinDate: "2022-01-15", ordersHandled: 0 },
  { id: "s2", name: "Nguyễn Thị Lan", role: "MANAGER", email: "lan.nguyen@restaurant.com", phone: "0912345678", avatar: "L", shift: "Sáng (6h-14h)", status: "ACTIVE", joinDate: "2022-03-20", ordersHandled: 0 },
  { id: "s3", name: "Nguyễn Văn A", role: "WAITER", email: "a.nguyen@restaurant.com", phone: "0923456789", avatar: "A", shift: "Sáng (6h-14h)", status: "ACTIVE", joinDate: "2023-06-01", ordersHandled: 342 },
  { id: "s4", name: "Trần Thị B", role: "WAITER", email: "b.tran@restaurant.com", phone: "0934567890", avatar: "B", shift: "Chiều (14h-22h)", status: "ACTIVE", joinDate: "2023-08-15", ordersHandled: 289 },
  { id: "s5", name: "Lê Văn C", role: "CASHIER", email: "c.le@restaurant.com", phone: "0945678901", avatar: "C", shift: "Sáng (6h-14h)", status: "ACTIVE", joinDate: "2023-04-10", ordersHandled: 512 },
  { id: "s6", name: "Phạm Thị D", role: "WAITER", email: "d.pham@restaurant.com", phone: "0956789012", avatar: "D", shift: "Chiều (14h-22h)", status: "ON_LEAVE", joinDate: "2024-01-05", ordersHandled: 156 },
  { id: "s7", name: "Hoàng Văn E", role: "CHEF", email: "e.hoang@restaurant.com", phone: "0967890123", avatar: "E", shift: "Sáng (6h-14h)", status: "ACTIVE", joinDate: "2022-11-20", ordersHandled: 0 },
  { id: "s8", name: "Vũ Thị F", role: "CHEF", email: "f.vu@restaurant.com", phone: "0978901234", avatar: "F", shift: "Chiều (14h-22h)", status: "ACTIVE", joinDate: "2023-02-28", ordersHandled: 0 },
];

// ─────────────────────────────────────────
// VOUCHERS
// ─────────────────────────────────────────
export interface Voucher {
  id: string;
  code: string;
  name: string;
  discount: number;
  discountType: "PERCENT" | "FIXED";
  minOrder: number;
  maxDiscount?: number;
  usedCount: number;
  maxUse: number;
  expiresAt: string;
  status: VoucherStatus;
}

export const mockVouchers: Voucher[] = [
  { id: "v1", code: "WELCOME20", name: "Chào mừng khách mới", discount: 20, discountType: "PERCENT", minOrder: 200000, maxDiscount: 100000, usedCount: 45, maxUse: 100, expiresAt: "2025-06-30", status: "ACTIVE" },
  { id: "v2", code: "SUMMER50K", name: "Khuyến mãi hè 2025", discount: 50000, discountType: "FIXED", minOrder: 300000, usedCount: 128, maxUse: 200, expiresAt: "2025-08-31", status: "ACTIVE" },
  { id: "v3", code: "VIP15", name: "Ưu đãi khách VIP", discount: 15, discountType: "PERCENT", minOrder: 500000, maxDiscount: 200000, usedCount: 22, maxUse: 50, expiresAt: "2025-12-31", status: "ACTIVE" },
  { id: "v4", code: "FLASH100K", name: "Flash sale tháng 4", discount: 100000, discountType: "FIXED", minOrder: 400000, usedCount: 200, maxUse: 200, expiresAt: "2025-04-30", status: "EXPIRED" },
  { id: "v5", code: "TETNEW30", name: "Tết 2025", discount: 30, discountType: "PERCENT", minOrder: 600000, maxDiscount: 300000, usedCount: 89, maxUse: 100, expiresAt: "2025-02-28", status: "EXPIRED" },
];

// ─────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
  isVip: boolean;
  joinDate: string;
  lastVisit: string;
}

export const mockCustomers: Customer[] = [
  { id: "c1", name: "Nguyễn Gia Đình", phone: "0901111222", email: "giadinh@email.com", points: 2450, totalSpent: 12500000, totalOrders: 48, isVip: true, joinDate: "2023-01-10", lastVisit: "2025-05-28" },
  { id: "c2", name: "Trần Văn Khởi", phone: "0912223333", email: "khoi.tv@email.com", points: 1820, totalSpent: 8900000, totalOrders: 32, isVip: true, joinDate: "2023-03-22", lastVisit: "2025-05-25" },
  { id: "c3", name: "Lê Thị Hương", phone: "0923334444", points: 950, totalSpent: 4200000, totalOrders: 18, isVip: false, joinDate: "2023-07-05", lastVisit: "2025-05-20" },
  { id: "c4", name: "Phạm Quang Minh", phone: "0934445555", email: "minh.pq@email.com", points: 3100, totalSpent: 18700000, totalOrders: 67, isVip: true, joinDate: "2022-11-14", lastVisit: "2025-05-29" },
  { id: "c5", name: "Hoàng Thị Mai", phone: "0945556666", points: 420, totalSpent: 1800000, totalOrders: 8, isVip: false, joinDate: "2024-02-20", lastVisit: "2025-05-15" },
  { id: "c6", name: "Vũ Đức Thắng", phone: "0956667777", email: "thang.vd@email.com", points: 680, totalSpent: 3100000, totalOrders: 14, isVip: false, joinDate: "2023-09-30", lastVisit: "2025-05-18" },
  { id: "c7", name: "Đinh Thanh Trúc", phone: "0967778888", points: 2890, totalSpent: 15600000, totalOrders: 55, isVip: true, joinDate: "2022-06-01", lastVisit: "2025-05-27" },
];

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────
export interface Notification {
  id: string;
  type: "ORDER" | "PAYMENT" | "SYSTEM" | "STAFF" | "RESERVATION";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const mockNotifications: Notification[] = [
  { id: "n1", type: "ORDER", title: "Đơn hàng mới", message: "Bàn 4 vừa đặt đơn ORD-0089 trị giá 410,000₫", createdAt: "2025-05-29T09:45:00Z", isRead: false },
  { id: "n2", type: "ORDER", title: "Đơn hàng mới", message: "Bàn 9 vừa đặt đơn ORD-0085 trị giá 220,000₫", createdAt: "2025-05-29T09:30:00Z", isRead: false },
  { id: "n3", type: "PAYMENT", title: "Thanh toán thành công", message: "Đơn ORD-0084 bàn 5 đã thanh toán 360,000₫", createdAt: "2025-05-29T08:20:00Z", isRead: false },
  { id: "n4", type: "RESERVATION", title: "Đặt bàn mới", message: "Nguyễn Gia Đình đặt bàn 10 lúc 11:30 hôm nay", createdAt: "2025-05-29T08:00:00Z", isRead: true },
  { id: "n5", type: "SYSTEM", title: "Cập nhật hệ thống", message: "Hệ thống đã được cập nhật phiên bản mới", createdAt: "2025-05-29T07:00:00Z", isRead: true },
  { id: "n6", type: "STAFF", title: "Nhân viên xin nghỉ phép", message: "Phạm Thị D xin nghỉ phép ngày 30/05/2025", createdAt: "2025-05-28T16:30:00Z", isRead: true },
  { id: "n7", type: "PAYMENT", title: "Thanh toán thành công", message: "Đơn ORD-0081 bàn 3 đã thanh toán 279,000₫", createdAt: "2025-05-29T09:05:00Z", isRead: false },
  { id: "n8", type: "ORDER", title: "Hủy đơn hàng", message: "Đơn ORD-0088 bàn 6 đã bị hủy", createdAt: "2025-05-29T08:05:00Z", isRead: true },
];

// ─────────────────────────────────────────
// REVENUE (for dashboard / reports)
// ─────────────────────────────────────────
export const mockRevenueByDay = [
  { date: "23/05", revenue: 8500000, orders: 62 },
  { date: "24/05", revenue: 7200000, orders: 54 },
  { date: "25/05", revenue: 9800000, orders: 71 },
  { date: "26/05", revenue: 11200000, orders: 83 },
  { date: "27/05", revenue: 10500000, orders: 78 },
  { date: "28/05", revenue: 12800000, orders: 94 },
  { date: "29/05", revenue: 6400000, orders: 47 },
];

export const mockTopDishes = [
  { name: "Phở bò đặc biệt", sold: 512, revenue: 48640000 },
  { name: "Bia Heineken", sold: 678, revenue: 23730000 },
  { name: "Nước cam ép", sold: 421, revenue: 18945000 },
  { name: "Bò lúc lắc", sold: 342, revenue: 64638000 },
  { name: "Cappuccino", sold: 234, revenue: 15210000 },
];

// Helpers
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};
