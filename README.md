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

## Phân công — 4 người

| Người  | Phụ trách | Nhánh Git |
|--------|-----------|-----------|
| **Thắng** | Auth, User Management, Security, Config, Common, Email | `feature/auth-infra` |
| **Thy**   | Table, Reservation, Menu Management, thuật toán tối ưu gợi ý bàn | `feature/table-reservation-menu` |
| **Sinh**  | Order, Payment, Invoice, Voucher | `feature/order-payment-voucher` |
| **Minh**  | KDS (Kitchen Display System), Customer Loyalty, Point | `feature/kds-loyalty` |

## Entity sở hữu

| Entity | Người |
|--------|-------|
| User, PasswordResetToken | Thắng |
| Table, Reservation, MenuItem | Thy |
| Order, OrderItem, Invoice, Voucher | Sinh |
| Customer, PointTransaction | Minh |

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

### Setup database
```bash
psql -U postgres -c "CREATE DATABASE restaurant_dev;"
```

### Chạy dev
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Swagger UI: http://localhost:8080/swagger-ui.html

## Git workflow

1. Mỗi người làm việc trên nhánh riêng (xem bảng phân công)
2. Pull request → review bởi ít nhất 1 người → merge vào `dev`
3. **KHÔNG sửa chung file**. Nếu cần dữ liệu của module khác → gọi API.
4. Migration: V1__ (Thắng), V2__ (Thy), V3__ (Sinh), V4__ (Minh)

## Phong cách code

- Entity: JPA `@Entity` + `@Table`, không dùng Lombok cho entity
- DTO: Dùng Java `record` (hoặc class nếu cần)
- Service: Interface + Implementation
- Validation: Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Email`, `@Size`)
- Exception: GlobalExceptionHandler + custom exceptions
- MapStruct cho entity ↔ DTO mapping
- Thymeleaf cho email templates + invoice HTML
- WebSocket STOMP cho KDS real-time notification
