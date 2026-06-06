package com.restaurant.common.enums;

public enum TableStatus {
    OPEN,       // Xanh lá - Sẵn sàng nhận khách (Bàn trống)
    SERVING,    // Đỏ - Đang có khách
    PAID,       // Xám - Chờ dọn dẹp
    RESERVED    // Vàng - Có lịch hẹn trong 1 giờ
}
