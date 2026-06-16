# Luồng Hoạt Động Của Toàn Bộ Tính Năng Frontend-User (Restaurant Management)

Tài liệu này mô tả chi tiết toàn bộ luồng hoạt động của **tất cả** các chức năng trong ứng dụng `frontend-user`. 
Mỗi chức năng sẽ đi từ giao diện người dùng (Component/Page) xuống tầng giao tiếp API (Service) và gọi tới Backend.

---

## 1. Xác Thực Người Dùng (Authentication)

Bao gồm các chức năng: Đăng nhập, Đăng ký, Đổi mật khẩu, Quên mật khẩu.

**Luồng đi:** Các Page `(Login | RegisterPage | ChangePass | ForgotPass)` -> `AuthContext` / `authService` -> `Backend API`

- **File UI:** `src/pages/Login/index.tsx`, `src/pages/RegisterPage/index.tsx`, `src/pages/ChangePass/index.tsx`, `src/pages/ForgotPass/index.tsx`
- **File Service:** `src/services/authService.ts`, `src/context/AuthContext.tsx`

**Chi tiết luồng:**
1. **Đăng nhập:** Người dùng nhập `loginId` và `password`. Component gọi hàm `login` từ `useAuth()`. `AuthContext` sử dụng `authService.login()` gọi API `POST /api/auth/login`. Khi nhận JWT token từ Backend, token được lưu vào localStorage và state, trang được chuyển hướng dựa trên role (ví dụ: Staff thì vào `/staff`).
2. **Đăng ký:** Người dùng điền Form. Gọi `authService.register()` -> `POST /api/auth/register`. Thành công sẽ chuyển hướng sang trang Đăng nhập.
3. **Đổi mật khẩu:** Yêu cầu đã đăng nhập (lấy token). Gọi `authService.changePassword()` -> `POST /api/auth/change-password` với mật khẩu cũ và mới.
4. **Quên mật khẩu:** Gọi `authService.forgotPassword()` gửi yêu cầu lấy lại mật khẩu.

---

## 2. Customer - Trang Cá Nhân & Thực Đơn

**Luồng đi:** `ProfilePage` & `MenuPage` -> `AuthContext` / `menuService` -> `Backend API`

- **File UI:** `src/pages/ProfilePage/index.tsx`, `src/pages/MenuPage/index.tsx`
- **File Service:** `src/services/menuService.ts`

**Chi tiết luồng:**
1. **Trang Cá Nhân (Profile):** `ProfilePage` đọc thông tin người dùng hiện tại thông qua `useAuth()`. Trạng thái `user` được load từ `localStorage` bởi `AuthContext`. Hiển thị các thông tin: Tên, Role, Điểm tích lũy, Tổng chi tiêu, Hạng thành viên.
2. **Thực Đơn (Menu):** Sử dụng custom hook `useMenu()`, gọi đến `menuService.getMenu()` -> API `GET /api/menu/public`. Dữ liệu trả về được lưu vào state để cho phép phân trang, tìm kiếm và lọc món ăn theo danh mục (`category`).

---

## 3. Customer - Đặt Bàn & Tra Cứu (Booking)

**Luồng đi:** `BookingPage` -> `reservationService` -> `Backend API`

- **File UI:** `src/pages/Booking/index.tsx`
- **File Service:** `src/services/reservationService.ts`

**Chi tiết luồng:**
1. **Tra cứu bàn trống:** Khách hàng có thể kiểm tra xem ngày/giờ nào còn bàn trống. Gọi API `GET /api/reservations/available-dates` hoặc `GET /api/reservations/available-times` với tham số số lượng khách.
2. **Đặt bàn:** Khách hàng nhập thông tin (Tên, SĐT, Ngày, Giờ, Số người). Component gọi `reservationService.createReservation()` -> `POST /api/reservations`. 
3. Backend tạo phiếu đặt bàn với status `PENDING`. UI hiển thị thông báo thành công.

---

## 4. Staff - Quản Lý & Mở Bàn (Table Management)

**Luồng đi:** `StaffPage` -> `tableService` / `orderService` -> `Backend API`

- **File UI:** `src/pages/StaffPage/index.tsx`
- **File Service:** `src/services/tableService.ts`, `src/services/orderService.ts`

**Chi tiết luồng:**
1. **Lấy danh sách bàn:** Tab "Danh sách bàn" gọi `tableService.getTables()` -> `GET /api/tables` để vẽ sơ đồ bàn với các trạng thái (`EMPTY`, `SERVING`, `CLEANING`, v.v.).
2. **Mở bàn:** Chọn bàn `EMPTY` và nhấn "Mở bàn". `StaffPage` gọi `orderService.createOrder({ tableId })` -> `POST /api/orders`. Backend sinh Order và chuyển trạng thái bàn sang `SERVING`. Component tải lại danh sách bàn để cập nhật UI.

---

## 5. Staff - Quản Lý Đặt Bàn (Reservations Management)

**Luồng đi:** `StaffPage` -> `reservationService` -> `tableService` -> `Backend API`

- **File UI:** `src/pages/StaffPage/index.tsx` (Tab Reservations)
- **File Service:** `src/services/reservationService.ts`

**Chi tiết luồng:**
1. **Xem danh sách đặt bàn:** Tại tab "Quản lý đặt bàn", hệ thống gọi `reservationService.getReservations()` -> API `GET /api/reservations/date/{date}` để lấy các đơn `PENDING`, `CONFIRMED`.
2. **Xác nhận đặt bàn (Confirm):** Nhân viên duyệt đơn, chọn 1 bàn trống tương ứng để gán cho khách. Frontend truyền cả ID nhân viên (`X-Staff-ID`) xuống Backend -> gọi API xác nhận.
3. **Các thao tác khác:** Nhân viên có thể ghi nhận "Khách đã đến" (Arrived), "Khách không đến" (No show), Từ chối đơn, hoặc Hủy đơn. Từng hành động gọi các endpoint PUT/POST tương ứng của `reservationService`. Trạng thái bàn sẽ được cập nhật đồng bộ (`RESERVED` / `SERVING` / `EMPTY`).

---

## 6. Staff - Gọi Món (Order)

**Luồng đi:** `StaffPage` -> `orderService` -> `Backend API`

- **File UI:** `src/pages/StaffPage/index.tsx` (Tab Gọi món)
- **File Service:** `src/services/orderService.ts`

**Chi tiết luồng:**
1. Khi chọn một bàn đang `SERVING`, UI gọi `orderService.getOpenOrderByTable(tableId)` -> `GET /api/orders/table/{tableId}/open` để lấy chi tiết Order.
2. Món được thêm từ Menu vào giỏ hàng tạm (`cart`).
3. Xác nhận gọi: Lặp qua `cart` và gọi `orderService.addOrderItem(orderId, item)` -> `POST /api/orders/{orderId}/items`.
4. Gọi xong thì tải lại Order hiện tại để hiển thị lại hóa đơn chính thức từ Backend.

---

## 7. Staff - Thanh Toán & VNPay (Checkout)

**Luồng đi:** `StaffPage` -> `invoiceService` -> (Tuỳ chọn VNPay: `VnpayReturnPage`) -> `Backend API`

- **File UI:** `src/pages/StaffPage/index.tsx`, `src/pages/VnpayReturnPage/index.tsx`
- **File Service:** `src/services/invoiceService.ts`

**Chi tiết luồng:**
1. **Tạm tính (Preview):** Nhấn "Thanh toán", gọi API `POST /api/invoices/preview`. Hiển thị popup thanh toán với tổng tiền, thuế.
2. **Thanh toán Tiền mặt:** Gọi API `POST /api/invoices/checkout/cash`. Backend hoàn tất Order, tạo Invoice, tích điểm KH, chuyển bàn sang `CLEANING`.
3. **Thanh toán VNPay:** Gọi API `POST /api/invoices/checkout/vnpay` -> Backend trả về `paymentUrl`. Frontend redirect user sang cổng VNPay.
4. **VNPAY Return:** Sau khi thanh toán ở VNPay, VNPay redirect về `/vnpay-return`. Component `VnpayReturnPage` bắt query params (`?success=true&invoiceId=...`). Component thông báo trạng thái "Thành công" / "Thất bại" và cho phép nhân viên trở lại màn quản lý.

---

## 8. Chatbot AI (Tư Vấn Tự Động)

**Luồng đi:** `Chatbot Component` -> `AI Service API (Python FastAPI)`

- **File UI:** `src/component/common/Chatbot/Chatbot.tsx`

**Chi tiết luồng:**
1. Nút chat nổi xuất hiện mọi nơi do được nhúng trong `App.tsx`.
2. Khi người dùng nhập text, hàm `handleSend` thực thi lệnh `fetch()` gửi chuỗi text trực tiếp đến `http://127.0.0.1:8000/api/chat`.
3. Backend AI (Python) xử lý logic, có thể gọi sang Backend Java thông qua các Function Tools của Agent, để đọc DB.
4. Nhận được phản hồi `answer` (JSON), UI thêm vào danh sách hội thoại và hiển thị cho khách.
