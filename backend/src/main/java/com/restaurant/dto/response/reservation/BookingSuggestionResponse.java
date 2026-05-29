package com.restaurant.dto.response.reservation;


import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class BookingSuggestionResponse {

    /** Ngày khách rảnh */
    private LocalDate date;

    /** Số người trong nhóm */
    private Integer partySize;

    /**
     * Danh sách giờ còn có thể đặt bàn trong ngày này.
     * Trống nếu ngày đó đã full capacity.
     */
    private List<LocalTime> availableSlots;
}
