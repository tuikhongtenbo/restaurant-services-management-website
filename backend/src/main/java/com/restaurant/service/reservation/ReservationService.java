package com.restaurant.service.reservation;

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.BookingSuggestionResponse;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReservationService {

    // Lấy danh sách lịch đặt bàn phân trang (hỗ trợ lọc linh hoạt theo ngày và/hoặc trạng thái)
    Page<ReservationResponse> getReservations(LocalDate date, ReservationStatus status, Pageable pageable);

    // Lấy thông tin chi tiết một lượt đặt bàn theo ID
    ReservationResponse getById(UUID id);

    // Tiếp nhận thông tin đặt bàn mới, lưu ở trạng thái PENDING; capacity check được thực hiện ở bước confirmReservation
    ReservationResponse createReservation(CreateReservationRequest request, UUID staffId);

    // Xác nhận đơn PENDING: kiểm tra capacity → CONFIRMED nếu còn chỗ, tự động CANCELLED nếu hết chỗ
    ReservationResponse confirmReservation(UUID id, UUID staffId);

    // Cập nhật thông tin khách hàng hoặc thời gian của một đơn đặt bàn (cho phép sửa ở trạng thái PENDING/CONFIRMED)
    ReservationResponse update(UUID id, UpdateReservationRequest request);

    // Đánh dấu khách đã đến nhận bàn; đồng thời chuyển trạng thái bàn được gán sang SERVING
    ReservationResponse arrived(UUID id);

    // Huỷ đơn đặt bàn; giải phóng bàn (nếu có) và lưu vết người huỷ cùng lý do
    ReservationResponse cancel(UUID id, UUID cancelledBy, String reason);

    // Tác vụ tự động: quét và gán bàn trống tối ưu cho các đơn CONFIRMED sắp đến giờ
    void autoAssignTables();

    // Tác vụ tự động: huỷ các đơn CONFIRMED quá giờ hẹn mà khách không check-in
    void autoCancelExpired();

    // Lấy thông tin tổng hợp đặt bàn trong ngày, bóc tách theo từng trạng thái (dùng cho Dashboard/Calendar)
    ReservationCalendarResponse getCalendar(LocalDate date);

    // Gợi ý các khung giờ còn trống theo danh sách ngày và số người khách cung cấp
    List<BookingSuggestionResponse> suggestBookingSlots(List<LocalDate> preferredDates, Integer partySize);

    void delete(UUID id);
}