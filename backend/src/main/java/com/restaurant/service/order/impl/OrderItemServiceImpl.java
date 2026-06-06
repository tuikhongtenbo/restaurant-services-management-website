package com.restaurant.service.order.impl;

import com.restaurant.common.enums.MenuItemStatus;
import com.restaurant.common.enums.OrderItemStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.dto.request.order.AddOrderItemRequest;
import com.restaurant.dto.request.order.UpdateOrderItemRequest;
import com.restaurant.dto.response.order.OrderItemResponse;
import com.restaurant.model.MenuItem;
import com.restaurant.model.Order;
import com.restaurant.model.OrderItem;
import com.restaurant.repository.MenuItemRepository;
import com.restaurant.repository.OrderItemRepository;
import com.restaurant.repository.OrderRepository;
import com.restaurant.service.order.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository; 

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy danh sách món của một order
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public List<OrderItemResponse> getItemsByOrderId(UUID orderId) {
        // Logic: Tìm tất cả OrderItem thuộc orderId và map sang DTO
        return orderItemRepository.findByOrder_Id(orderId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE: Thêm món vào order
    //  1. Tìm MenuItem để lấy tên và giá (tránh giá bị thay đổi sau khi đặt)
    //  2. Kiểm tra món phải AVAILABLE — nếu không → ném BusinessException
    //  3. Tính giá áp dụng: nếu đang trong giờ KM → dùng promoPrice, ngược lại dùng price
    //  4. Tìm Order, tạo và lưu OrderItem
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderItemResponse addItem(UUID orderId, AddOrderItemRequest request, UUID orderedBy) {
        // Bước 1: Lấy thông tin MenuItem — snapshot giá/tên tại thời điểm gọi món
        MenuItem menuItem = menuItemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", request.getItemId()));

        // Bước 2: Kiểm tra trạng thái món — chỉ chấp nhận AVAILABLE
        if (menuItem.getStatus() != MenuItemStatus.AVAILABLE) {
            throw new BusinessException("Món \"" + menuItem.getName() + "\" hiện không khả dụng!");
        }

        // Bước 3: Tính giá áp dụng — ưu tiên promoPrice nếu đang trong khung giờ KM
        BigDecimal appliedPrice = resolvePrice(menuItem);

        // Bước 4: Tìm Order đang mở để gắn item vào
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != com.restaurant.common.enums.OrderStatus.OPEN) {
            throw new BusinessException("Không thể thêm món vào đơn đã đóng hoặc huỷ!");
        }

        // Tạo OrderItem với thông tin chụp (snapshot) từ MenuItem
        OrderItem item = OrderItem.builder()
                .order(order)
                .itemId(menuItem.getId())
                .itemName(menuItem.getName())       // Snapshot tên món
                .unitPrice(appliedPrice)            // Snapshot giá (có thể là giá KM)
                .quantity(request.getQuantity())
                .note(request.getNote())
                .orderedBy(orderedBy)
                .build();

        return mapToResponse(orderItemRepository.save(item));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE: Cập nhật số lượng hoặc ghi chú của một order item
    //  - Chỉ được sửa khi item đang ở trạng thái PENDING
    //  - Nếu quantity = 0 → huỷ item thay vì lưu số lượng 0
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderItemResponse updateItem(UUID orderId, UUID itemId, UpdateOrderItemRequest request) {
        // Logic: Lấy order item, kiểm tra trạng thái — chỉ PENDING mới được sửa
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", itemId));

        if (item.getStatus() != OrderItemStatus.PENDING) {
            throw new BusinessException("Chỉ có thể cập nhật món đang ở trạng thái PENDING!");
        }

        if (request.getQuantity() != null) {
            if (request.getQuantity() == 0) {
                // Quantity = 0 → huỷ item thay vì set về 0
                item.setStatus(OrderItemStatus.CANCELLED);
                item.setCancelReason("Huỷ bởi cập nhật số lượng = 0");
                item.setCancelledAt(OffsetDateTime.now());
            } else {
                item.setQuantity(request.getQuantity());
            }
        }
        if (request.getNote() != null) {
            item.setNote(request.getNote());
        }

        return mapToResponse(orderItemRepository.save(item));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CANCEL: Huỷ một order item kèm lý do
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderItemResponse cancelItem(UUID orderId, UUID itemId, String reason, UUID cancelledBy) {
        // Logic: Cập nhật trạng thái thành CANCELLED, lưu lý do và người huỷ
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", itemId));

        if (item.getStatus() != OrderItemStatus.PENDING && item.getStatus() != OrderItemStatus.PREPARING) {
            throw new BusinessException("Chỉ có thể huỷ món đang ở trạng thái PENDING hoặc PREPARING!");
        }

        item.setStatus(OrderItemStatus.CANCELLED);
        item.setCancelReason(reason);
        item.setCancelledBy(cancelledBy);
        item.setCancelledAt(OffsetDateTime.now());

        return mapToResponse(orderItemRepository.save(item));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE STATUS: Bếp/Phục vụ cập nhật trạng thái món ăn
    //  PENDING → PREPARING → READY → SERVED
    //  Ghi nhận thời điểm chuyển trạng thái vào readyAt / servedAt
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderItemResponse updateItemStatus(UUID itemId, OrderItemStatus status) {
        // Logic: Lấy item, cập nhật status và ghi timestamp tương ứng
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", "id", itemId));

        OrderItemStatus currentStatus = item.getStatus();
        
        // Validate state machine
        if (status == OrderItemStatus.PREPARING && currentStatus != OrderItemStatus.PENDING) {
            throw new BusinessException("Chỉ món PENDING mới có thể chuyển sang PREPARING");
        }
        if (status == OrderItemStatus.READY && currentStatus != OrderItemStatus.PREPARING) {
            throw new BusinessException("Chỉ món PREPARING mới có thể chuyển sang READY");
        }
        if (status == OrderItemStatus.SERVED && currentStatus != OrderItemStatus.READY) {
            throw new BusinessException("Chỉ món READY mới có thể chuyển sang SERVED");
        }
        if (status == OrderItemStatus.CANCELLED) {
            throw new BusinessException("Vui lòng sử dụng API cancelItem để huỷ món");
        }
        if (status == OrderItemStatus.PENDING) {
            throw new BusinessException("Không thể lùi trạng thái về PENDING");
        }

        item.setStatus(status);

        // Ghi lại thời điểm bếp hoàn thành món (readyAt)
        if (status == OrderItemStatus.READY) {
            item.setReadyAt(OffsetDateTime.now());
            // TODO: Gọi KdsNotificationService.notifyReady(item) nếu cần thông báo bàn
        }

        // Ghi lại thời điểm phục vụ mang món ra bàn (servedAt)
        if (status == OrderItemStatus.SERVED) {
            item.setServedAt(OffsetDateTime.now());
        }

        return mapToResponse(orderItemRepository.save(item));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Tính giá áp dụng cho món
    //  - Nếu promoPrice != null và hiện tại nằm trong [promoStart, promoEnd] → dùng promoPrice
    //  - Ngược lại → dùng price gốc
    // ─────────────────────────────────────────────────────────────────────────
    private BigDecimal resolvePrice(MenuItem menuItem) {
        if (menuItem.getPromoPrice() != null
                && menuItem.getPromoStart() != null
                && menuItem.getPromoEnd() != null) {
            LocalTime now = LocalTime.now();
            if (!now.isBefore(menuItem.getPromoStart()) && !now.isAfter(menuItem.getPromoEnd())) {
                return menuItem.getPromoPrice();
            }
        }
        return menuItem.getPrice();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map OrderItem entity → OrderItemResponse DTO
    // ─────────────────────────────────────────────────────────────────────────
    private OrderItemResponse mapToResponse(OrderItem item) {
        BigDecimal total = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return OrderItemResponse.builder()
                .id(item.getId())
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .totalPrice(total)
                .note(item.getNote())
                .status(item.getStatus())
                .orderedAt(item.getOrderedAt())
                .readyAt(item.getReadyAt())
                .servedAt(item.getServedAt())
                .build();
    }
}
