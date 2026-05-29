package com.restaurant.common.enums;

public enum ReservationTime {
    // Bàn được giữ trước bao nhiêu phút
    ASSIGN_BEFORE_MINUTES(30),
    // Tự động hủy sau bao nhiêu phút quá giờ
    AUTO_CANCEL_MINUTES(30),
    // Mỗi lần đặt bàn chiếm bao nhiêu giờ
    RESERVATION_DURATION_HOURS(2);

    private final int value;

    ReservationTime(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}

