package com.restaurant.common.utils;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public final class DateTimeUtils {

    private DateTimeUtils() {}

    private static final DateTimeFormatter DATE_FMT   = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT   = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    public static String formatDate(LocalDateTime dt) {
        return dt == null ? null : dt.format(DATE_FMT);
    }

    public static String formatTime(LocalDateTime dt) {
        return dt == null ? null : dt.format(TIME_FMT);
    }

    public static String formatDateTime(LocalDateTime dt) {
        return dt == null ? null : dt.format(DATETIME_FMT);
    }

    public static boolean isBetweenTime(LocalTime target, LocalTime start, LocalTime end) {
        if (start == null || end == null) return false;
        return !target.isBefore(start) && !target.isAfter(end);
    }

    public static long minutesBetween(LocalDateTime from, LocalDateTime to) {
        return java.time.Duration.between(from, to).toMinutes();
    }
}
