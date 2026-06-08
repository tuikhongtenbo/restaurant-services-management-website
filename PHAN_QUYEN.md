# Bảng Phân Quyền Hệ Thống Backend - Restaurant Services Management

Tài liệu này mô tả chi tiết các phân quyền cho từng thao tác chức năng của hệ thống, dựa trên cấu trúc các controller trong mã nguồn.

---

## 1. Xác thực & Quản lý người dùng (Auth & Admin)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Nhân viên Đăng nhập** | `POST` | `/api/auth/login` | Công khai (Public) |
| **Xem thông tin cá nhân (NV)** | `GET` | `/api/auth/me` | Đã đăng nhập (Authenticated) |
| **Đổi mật khẩu (NV)** | `PUT` | `/api/auth/change-password` | Đã đăng nhập (Authenticated) |
| **Quên mật khẩu (Gửi email)** | `POST` | `/api/auth/forgot-password` | Công khai (Public) |
| **Đặt lại mật khẩu (Token)** | `POST` | `/api/auth/reset-password` | Công khai (Public) |
| **Khách hàng Đăng ký** | `POST` | `/api/auth/customer/register` | Công khai (Public) |
| **Khách hàng Đăng nhập** | `POST` | `/api/auth/customer/login` | Công khai (Public) |
| **Xem thông tin cá nhân (KH)**| `GET` | `/api/auth/customer/me` | Đã đăng nhập (Customer) |
| **Xem danh sách Roles** | `GET` | `/api/admin/roles` | `ADMIN`, `MANAGER` |
| **Lấy danh sách nhân viên** | `GET` | `/api/admin/users` | `ADMIN`, `MANAGER` |
| **Lấy chi tiết nhân viên** | `GET` | `/api/admin/users/{id}` | `ADMIN`, `MANAGER` |
| **Tạo nhân viên mới** | `POST` | `/api/admin/users` | `ADMIN`, `MANAGER` |
| **Cập nhật nhân viên** | `PUT` | `/api/admin/users/{id}` | `ADMIN`, `MANAGER` |
| **Khoá tài khoản NV** | `PUT` | `/api/admin/users/{id}/lock` | `ADMIN`, `MANAGER` |
| **Mở khoá tài khoản NV** | `PUT` | `/api/admin/users/{id}/unlock` | `ADMIN`, `MANAGER` |
| **Reset mật khẩu NV** | `PUT` | `/api/admin/users/{id}/reset-password`| `ADMIN`, `MANAGER` |

---

## 2. Quản lý Bàn (Table Management)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Lấy danh sách bàn** | `GET` | `/api/tables` | Đã đăng nhập (Nhân viên) |
| **Xem sơ đồ bàn (Layout)** | `GET` | `/api/tables/layout` | Đã đăng nhập (Nhân viên) |
| **Xem bàn trống** | `GET` | `/api/tables/available` | Đã đăng nhập (Nhân viên) |
| **Xem chi tiết bàn** | `GET` | `/api/tables/{id}` | Đã đăng nhập (Nhân viên) |
| **Tạo bàn mới** | `POST` | `/api/tables` | `ADMIN`, `MANAGER` |
| **Cập nhật thông tin bàn** | `PUT` | `/api/tables/{id}` | `ADMIN`, `MANAGER` |
| **Cập nhật vị trí (Kéo thả)** | `PUT` | `/api/tables/{id}/position` | `ADMIN`, `MANAGER` |
| **Xóa / Ẩn bàn** | `DELETE` | `/api/tables/{id}` | `ADMIN`, `MANAGER` |
| **Mở bàn (Phục vụ)** | `POST` | `/api/tables/{id}/open` | Đã đăng nhập (Nhân viên) |
| **Đóng bàn** | `POST` | `/api/tables/{id}/close` | Đã đăng nhập (Nhân viên) |

---

## 3. Quản lý Thực đơn (Menu)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Danh sách món ăn (Public)** | `GET` | `/api/public/menu` | Công khai (Public) |
| **Chi tiết món ăn (Public)** | `GET` | `/api/public/menu/items/{id}` | Công khai (Public) |
| **Món bán chạy (Public)** | `GET` | `/api/public/menu/recommended` | Công khai (Public) |
| **Danh sách món (Quản trị)** | `GET` | `/api/menu/items` | Đã đăng nhập (Nhân viên) |
| **Chi tiết món (Quản trị)** | `GET` | `/api/menu/items/{id}` | Đã đăng nhập (Nhân viên) |
| **Lịch sử giá món** | `GET` | `/api/menu/items/{id}/price-history` | Đã đăng nhập (Nhân viên) |
| **Thêm món mới** | `POST` | `/api/menu/items` | `ADMIN`, `MANAGER` |
| **Cập nhật món** | `PUT` | `/api/menu/items/{id}` | `ADMIN`, `MANAGER` |
| **Cập nhật giá món** | `PUT` | `/api/menu/items/{id}/price` | `ADMIN`, `MANAGER` |
| **Cập nhật trạng thái món** | `PUT` | `/api/menu/items/{id}/status` | `ADMIN`, `MANAGER` |
| **Cập nhật thứ tự món** | `PUT` | `/api/menu/items/{id}/sort-order` | `ADMIN`, `MANAGER` |
| **Xóa món** | `DELETE` | `/api/menu/items/{id}` | `ADMIN`, `MANAGER` |
| **Danh sách danh mục** | `GET` | `/api/menu/categories` | Đã đăng nhập (Nhân viên) |
| **Tạo danh mục mới** | `POST` | `/api/menu/categories` | `ADMIN`, `MANAGER` |
| **Sửa danh mục** | `PUT` | `/api/menu/categories/{id}` | `ADMIN`, `MANAGER` |
| **Xóa danh mục** | `DELETE` | `/api/menu/categories/{id}` | `ADMIN`, `MANAGER` |

---

## 4. Quản lý Đơn hàng (Orders)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Lấy danh sách đơn hàng** | `GET` | `/api/orders` | Đã đăng nhập (Nhân viên) |
| **Lấy chi tiết đơn hàng** | `GET` | `/api/orders/{id}` | Đã đăng nhập (Nhân viên) |
| **Lấy đơn đang mở theo bàn**| `GET` | `/api/orders/table/{tableId}`| Đã đăng nhập (Nhân viên) |
| **Tạo đơn hàng mới** | `POST` | `/api/orders` | Đã đăng nhập (Nhân viên) |
| **Đóng đơn hàng** | `PUT` | `/api/orders/{id}/status/close`| `CASHIER`, `ADMIN`, `MANAGER` |
| **Danh sách món trong đơn** | `GET` | `/api/orders/{id}/items` | Đã đăng nhập (Nhân viên) |
| **Thêm món vào đơn** | `POST` | `/api/orders/{id}/items` | Đã đăng nhập (Nhân viên) |
| **Cập nhật sl/ghi chú món** | `PUT` | `/api/orders/{orderId}/items/{itemId}` | Đã đăng nhập (Nhân viên) |
| **Hủy món trong đơn** | `DELETE` | `/api/orders/{orderId}/items/{itemId}` | Đã đăng nhập (Nhân viên) |
| **Cập nhật trạng thái món** | `PUT` | `/api/orders/items/{itemId}/status` | Đã đăng nhập (Nhân viên) — chưa phân quyền role cụ thể |

---

## 5. Thanh toán & Hóa đơn (Payment & Invoices)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Tính toán trước (Preview)** | `POST` | `/api/payments/checkout` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Thanh toán Tiền mặt** | `POST` | `/api/payments/cash` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Tạo liên kết thanh toán VNPay**| `POST` | `/api/payments/vnpay/create` | `CASHIER`, `ADMIN`, `MANAGER` |
| **VNPay Return (Redirect)** | `GET` | `/api/payments/vnpay/return` | Công khai (Public) |
| **VNPay IPN (Webhook)** | `GET/POST`| `/api/payments/vnpay/ipn` | Công khai (Server-to-Server) |
| **Danh sách hóa đơn** | `GET` | `/api/payments/invoices`<br>`/api/invoices` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Chi tiết hóa đơn** | `GET` | `/api/payments/invoices/{id}`<br>`/api/invoices/{id}` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Hóa đơn theo Order** | `GET` | `/api/invoices/order/{orderId}`| `CASHIER`, `ADMIN`, `MANAGER` |
| **Hủy hóa đơn** | `POST/PUT`| `/api/payments/{id}/void`<br>`/api/invoices/{id}/void` | `ADMIN`, `MANAGER` |
| **Lấy HTML để in hóa đơn** | `GET` | `/api/invoices/{id}/print` | `CASHIER`, `ADMIN`, `MANAGER` |

---

## 6. Điểm thưởng & Voucher (Loyalty)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Lịch sử điểm của khách** | `GET` | `/api/point-transactions/customer/{customerId}`| `CASHIER`, `ADMIN`, `MANAGER` |
| **Lịch sử điểm theo hóa đơn** | `GET` | `/api/point-transactions/invoice/{invoiceId}` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Điều chỉnh điểm thủ công** | `POST` | `/api/point-transactions/adjust` | `ADMIN`, `MANAGER` |
| **Tính điểm từ số tiền** | `GET` | `/api/points/calculate` | Đã đăng nhập (Nhân viên) |
| **Danh sách Voucher** | `GET` | `/api/vouchers` | `ADMIN`, `MANAGER` |
| **Chi tiết Voucher** | `GET` | `/api/vouchers/{id}` | `ADMIN`, `MANAGER` |
| **Tìm Voucher theo mã** | `GET` | `/api/vouchers/code/{code}` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Voucher khả dụng** | `GET` | `/api/vouchers/available` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Tạo Voucher mới** | `POST` | `/api/vouchers` | `ADMIN`, `MANAGER` |
| **Cập nhật Voucher** | `PUT` | `/api/vouchers/{id}` | `ADMIN`, `MANAGER` |
| **Bật/Tắt Voucher** | `PATCH` | `/api/vouchers/{id}/toggle` | `ADMIN`, `MANAGER` |
| **Xóa Voucher** | `DELETE` | `/api/vouchers/{id}` | `ADMIN`, `MANAGER` |

---

## 7. Khách hàng (Customers)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Tra cứu điểm, thông tin** | `GET` | `/api/public/customers/lookup` | Công khai (Public) |
| **Lịch sử GD (6 tháng)** | `GET` | `/api/public/customers/{phone}/history` | Công khai (Public) |
| **Danh sách khách hàng** | `GET` | `/api/customers` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Tìm khách qua SĐT** | `GET` | `/api/customers/search` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Chi tiết khách hàng** | `GET` | `/api/customers/{id}` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Hạng khách hàng** | `GET` | `/api/customers/{id}/tier` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Cập nhật khách hàng** | `PUT` | `/api/customers/{id}` | `CASHIER`, `ADMIN`, `MANAGER` |
| **Điều chỉnh điểm (KH)** | `PUT` | `/api/customers/{id}/adjust-points` | `ADMIN` |
| **Lịch sử giao dịch điểm** | `GET` | `/api/customers/{id}/transactions`| `CASHIER`, `ADMIN`, `MANAGER` |

---

## 8. Đặt bàn (Reservations)

| Chức năng / Thao tác | Method | API (Endpoint) | Roles (Quyền truy cập) |
| :--- | :---: | :--- | :--- |
| **Tra cứu ngày trống** | `GET` | `/api/public/reservations/available-dates` | Công khai (Public) |
| **Tra cứu giờ trống** | `GET` | `/api/public/reservations/available-times` | Công khai (Public) |
| **Khách tự đặt bàn online** | `POST` | `/api/public/reservations` | Công khai (Public) |
| **Danh sách đặt bàn** | `GET` | `/api/reservations` | Đã đăng nhập (Nhân viên) |
| **Lịch đặt bàn (Calendar)** | `GET` | `/api/reservations/calendar` | Đã đăng nhập (Nhân viên) |
| **Lấy slot trống** | `GET` | `/api/reservations/available-slots` | Đã đăng nhập (Nhân viên) |
| **Hệ thống gợi ý bàn** | `GET` | `/api/reservations/suggest-table` | Đã đăng nhập (Nhân viên) |
| **Chi tiết đặt bàn** | `GET` | `/api/reservations/{id}` | Đã đăng nhập (Nhân viên) |
| **Nhân viên tạo đặt bàn** | `POST` | `/api/reservations` | Đã đăng nhập (Nhân viên) |
| **Cập nhật đặt bàn** | `PUT` | `/api/reservations/{id}` | Đã đăng nhập (Nhân viên) |
| **Xác nhận đặt bàn** | `PUT` | `/api/reservations/{id}/confirm` | Đã đăng nhập (Nhân viên) |
| **Đánh dấu khách đã đến** | `PUT` | `/api/reservations/{id}/arrived` | Đã đăng nhập (Nhân viên) |
| **Đánh dấu khách không đến**| `PUT` | `/api/reservations/{id}/no-show` | Đã đăng nhập (Nhân viên) |
| **Hủy đặt bàn** | `PUT` | `/api/reservations/{id}/cancel` | Đã đăng nhập (Nhân viên) |
| **Xóa bản ghi đặt bàn** | `DELETE` | `/api/reservations/{id}` | `MANAGER` |