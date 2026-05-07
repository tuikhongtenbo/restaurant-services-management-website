package com.restaurant.common.enums;

public enum OrderItemStatus {
    PENDING,        // Chờ xác nhận - Vừa gửi, bếp chưa nhận
    PREPARING,      // Đang chế biến - Bếp đã bắt đầu làm
    READY,          // Sẵn sàng - Món xong, chờ mang ra
    SERVED,         // Đã phục vụ - Waiter đã mang ra bàn
    CANCELLED       // Đã hủy - Có ghi rõ lý do
}
