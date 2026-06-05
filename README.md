# Restaurant Management System — Backend

## Cấu trúc thư mục

```
src/main/java/com/restaurant/
├── config/                    # Spring configs (Security, JWT, WebSocket, OpenAPI, Email)
├── common/                    # Dùng chung: enums, constants, exceptions, utils
├── model/                     # JPA Entities (11 bảng)
├── repository/                # JPA Repositories
├── dto/
│   ├── request/               # DTO nhận từ client
│   └── response/              # DTO trả về cho client
├── service/                   # Business logic (phân theo module)
├── controller/                # REST APIs (phân theo module)
├── security/                  # JWT Filter, TokenProvider, UserDetails
├── notification/              # WebSocket, KDS notification
└── email/                     # Email service + Thymeleaf templates
```

## Phân công 

| Người  | Phụ trách | Nhánh Git |
|--------|-----------|-----------|
| **Thắng** | Auth, User Management, Security, Config, Common, Email | `feature/auth-infra` |
| **Thy**   | Table, Reservation, Menu Management, Order, thuật toán tối ưu gợi ý bàn | `feature/table-reservation-menu` |
| **Sinh**  | KDS (Kitchen Display System), Customer Loyalty, Point | `feature/kds-loyalty` |
| **Minh**  | Order, Payment, Invoice, Voucher | `feature/order-payment-voucher` |

## API Endpoints chính

| Nhóm | Prefix | Vai trò |
|------|--------|---------|
| Auth | `/api/auth` | Công khai |
| User | `/api/admin/users` | ADMIN, MANAGER |
| Table | `/api/tables` | Tất cả nhân viên |
| Reservation | `/api/reservations` | STAFF |
| Reservation (online) | `/api/public/reservations` | Công khai |
| Menu | `/api/menu` | ADMIN, MANAGER |
| Menu (public) | `/api/public/menu` | Công khai |
| Order | `/api/orders` | WAITER |
| KDS | `/api/kds` | KITCHEN_STAFF |
| Payment | `/api/payments` | CASHIER, ADMIN, MANAGER |
| Invoice | `/api/invoices` | CASHIER, ADMIN, MANAGER |
| Customer | `/api/customers` | CASHIER, ADMIN, MANAGER |
| Customer (public) | `/api/public/customers` | Công khai |
| Voucher | `/api/vouchers` | ADMIN, MANAGER |
| Point | `/api/points` | CASHIER, ADMIN, MANAGER |

## Chạy ứng dụng

### Yêu cầu
- JDK 25
- PostgreSQL
- Maven 3.9+

Swagger UI: http://localhost:8080/swagger-ui.html

## Git workflow

1. Mỗi người làm việc trên nhánh riêng (xem bảng phân công)
2. Pull request → review bởi ít nhất 1 người → merge vào `dev`
3. **KHÔNG sửa chung file**. Nếu cần dữ liệu của module khác → gọi API.
4. Phần của Thy với Sinh sẽ dễ bị xung đột (Order ↔ Menu), nên Thy làm trước, Sinh thực hiện phần frontend xong rồi qua làm sau, thường xuyên colab với nhau để merge các features lại nhé.
5. Migration: V1_Thang, V2_Thy, V3_Minh, V4_Sinh