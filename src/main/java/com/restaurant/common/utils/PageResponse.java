package com.restaurant.common.utils;

import java.time.LocalDateTime;
import java.util.List;

public record PageResponse<T>(
    LocalDateTime timestamp,
    int status,
    String message,
    T data,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last
) {
    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = (int) Math.ceil((double) totalElements / size);
        return new PageResponse<>(
            LocalDateTime.now(),
            200,
            "Thành công",
            content,
            page,
            size,
            totalElements,
            totalPages,
            page == 0,
            page >= totalPages - 1
        );
    }
}
