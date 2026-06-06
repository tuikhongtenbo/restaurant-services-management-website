package com.restaurant.dto.request.booking;

import java.time.LocalDateTime;

public class BookingRequest {
    private String fullName;
    private String phone;
    private int partySize; // Số lượng khách (khớp với logic database)
    private String reservationTime; // Nhận chuỗi string dạng "2026-06-07T19:00:00" từ AI

    // Getters và Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public int getPartySize() { return partySize; }
    public void setPartySize(int partySize) { this.partySize = partySize; }

    public String getReservationTime() { return reservationTime; }
    public void setReservationTime(String reservationTime) { this.reservationTime = reservationTime; }
}