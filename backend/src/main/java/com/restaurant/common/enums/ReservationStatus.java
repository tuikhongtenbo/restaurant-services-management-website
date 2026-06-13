package com.restaurant.common.enums;

public enum ReservationStatus {
    PENDING,    // Chờ xác nhận
    REJECTED,   // Đã từ chối
    CONFIRMED,  // Đã xác nhận
    ARRIVED,    // Khách đã đến
    CANCELLED   // Đã hủy (hoặc khách không đến)
}