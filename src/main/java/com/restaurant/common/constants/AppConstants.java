package com.restaurant.common.constants;

public final class AppConstants {

    private AppConstants() {}

    // --- Point rules ---
    public static final int POINTS_PER_1000_VND = 10; // 1000 VND = 10 điểm
    public static final int POINTS_REDEEM_RATE   = 100; // 100 điểm = 1000 VND

    // --- Tier thresholds (total points earned) ---
    public static final int TIER_BRONZE_POINTS = 5000;
    public static final int TIER_SILVER_POINTS = 10000;
    public static final int TIER_GOLD_POINTS   = 50000;

    // --- Tier birthday voucher discount ---
    public static final int TIER_BRONZE_VOUCHER_DISCOUNT = 5;
    public static final int TIER_SILVER_VOUCHER_DISCOUNT = 10;
    public static final int TIER_GOLD_VOUCHER_DISCOUNT   = 15;

    // --- KDS thresholds (minutes) ---
    public static final int KDS_WARNING_MINUTES  = 5;
    public static final int KDS_DANGER_MINUTES    = 10;
    public static final int KDS_REMINDER_MINUTES  = 5; // Nhắc waiter sau khi ready

    // --- Reservation ---
    public static final int RESERVATION_AUTO_CANCEL_MINUTES = 30;

    // --- Pagination ---
    public static final int DEFAULT_PAGE_SIZE  = 20;
    public static final int MAX_PAGE_SIZE      = 100;

    // --- File upload ---
    public static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    public static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"};

    // --- Password ---
    public static final int PASSWORD_RESET_TOKEN_HOURS = 24;
    public static final int MIN_PASSWORD_LENGTH = 6;

    // --- JWT ---
    public static final String JWT_BEARER_PREFIX = "Bearer ";
    public static final String JWT_HEADER_NAME   = "Authorization";
}
