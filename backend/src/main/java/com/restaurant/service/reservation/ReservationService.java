package com.restaurant.service.reservation;

import com.restaurant.common.enums.ReservationStatus;
import com.restaurant.dto.request.reservation.CreateReservationRequest;
import com.restaurant.dto.request.reservation.UpdateReservationRequest;
import com.restaurant.dto.response.reservation.ReservationCalendarResponse;
import com.restaurant.dto.response.reservation.ReservationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface ReservationService {

    //Lấy danh sách lịch đặt bàn phân trang (Hỗ trợ lọc linh hoạt theo ngày và/hoặc trạng thái)
    Page<ReservationResponse> getReservations(LocalDate date, ReservationStatus status, Pageable pageable);

    //Lấy thông tin chi tiết một lượt đặt bàn theo ID chủ thể

    ReservationResponse getById(UUID id);

    //Tiếp nhận thông tin đặt bàn mới, tự động kiểm tra công suất/dung lượng bàn khả dụngđể tự động chuyển tiếp sang trạng thái xác nhận CONFIRMED (hoặc CANCELLED nếu hết chỗ)

    ReservationResponse createAndConfirm(CreateReservationRequest request, UUID staffId);

    //Cập nhật thông tin khách hàng hoặc thời gian của một đơn đặt bàn (Cho phép sửa ở trạng thái PENDING/CONFIRMED)

    ReservationResponse update(UUID id, UpdateReservationRequest request);

    //Đánh dấu khách đã đến nhận bàn ăn (Hệ thống đồng thời chuyển trạng thái bàn được gán sang SERVING)

    ReservationResponse arrived(UUID id);

    //Đánh dấu khách không đến (No-Show) để giải phóng vị trí bàn đã được giữ chỗ ngầm về lại EMPTY

    ReservationResponse noShow(UUID id);

    //Hủy đơn đặt bàn theo yêu cầu, giải phóng bàn ăn (nếu có) và lưu vết người hủy cùng lý do hủy
   
    ReservationResponse cancel(UUID id, UUID cancelledBy, String reason);

    //Tác vụ tự động quét ngầm tìm kiếm bàn trống tối ưu phù hợp nhất để gán (Assign) cho các đơn CONFIRMED sắp đến giờ
    void autoAssignTables();

    //Tác vụ tự động quét ngầm hủy bỏ các đơn đặt bàn CONFIRMED quá giờ hẹn mà khách không đến làm thủ tục check-in

    void autoCancelExpired();

    //Lấy thông tin tổng hợp số lượng đặt bàn bóc tách theo từng trạng thái phục vụ cho màn hình Dashboard/Calendar
     
    ReservationCalendarResponse getCalendar(LocalDate date);
}