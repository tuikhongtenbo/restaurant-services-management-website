package com.restaurant.common.enums;

public enum CustomerTier {
    MEMBER,   // Mặc định: >= 0 điểm
    BRONZE,   // >= 5000 điểm: voucher sinh nhật 5%
    SILVER,   // >= 10000 điểm: voucher sinh nhật 10%
    GOLD      // >= 50000 điểm: voucher sinh nhật 15%
}
