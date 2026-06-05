# Restaurant Management System — Backend

Hệ thống quản lý dịch vụ nhà hàng (Backend) cung cấp các API để phục vụ quản lý nhà hàng, bao gồm xác thực, quản lý bàn, đặt bàn, thực đơn, đơn hàng, hóa đơn và khách hàng.

## Cấu trúc thư mục

```text
src/main/java/com/restaurant/
├── config/                    # Spring configs (Security, JWT, WebSocket, OpenAPI)
├── common/                    # Dùng chung: enums, constants, exceptions, utils
├── model/                     # JPA Entities
├── repository/                # JPA Repositories
├── dto/
│   ├── request/               # DTO nhận từ client
│   └── response/              # DTO trả về cho client
├── service/                   # Business logic (phân theo module)
├── controller/                # REST APIs (phân theo module)
├── security/                  # JWT Filter, TokenProvider, UserDetails
└── notification/              # WebSocket notification
```

## Công nghệ sử dụng
- **Ngôn ngữ & Framework:** Java 25, Spring Boot
- **Database:** PostgreSQL
- **Build tool:** Maven 3.9+
- **Bảo mật:** Spring Security + JWT
- **Tài liệu API:** Swagger UI / OpenAPI (`http://localhost:8080/swagger-ui.html`)

## Tài liệu API & Phân quyền

Chi tiết về tất cả các API Endpoint, chức năng cũng như danh sách các Roles có quyền truy cập được mô tả chi tiết tại file: **[PHAN_QUYEN.md](./PHAN_QUYEN.md)**.