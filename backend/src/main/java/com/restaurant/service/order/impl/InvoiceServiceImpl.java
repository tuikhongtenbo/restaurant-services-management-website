package com.restaurant.service.order.impl;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.common.enums.OrderItemStatus;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.common.utils.PageResponse;
import com.restaurant.dto.response.order.InvoiceResponse;
import com.restaurant.model.Customer;
import com.restaurant.model.Invoice;
import com.restaurant.model.Order;
import com.restaurant.model.OrderItem;
import com.restaurant.model.Table;
import com.restaurant.model.User;
import com.restaurant.repository.CustomerRepository;
import com.restaurant.repository.InvoiceRepository;
import com.restaurant.repository.OrderItemRepository;
import com.restaurant.repository.OrderRepository;
import com.restaurant.repository.TableRepository;
import com.restaurant.repository.UserRepository;
import com.restaurant.service.order.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service("orderInvoiceServiceImpl")
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceServiceImpl.class);
    private static final DateTimeFormatter DISPLAY_DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final CustomerRepository customerRepository;
    private final TemplateEngine templateEngine;

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy danh sách hóa đơn, filter theo ngày và/hoặc thu ngân
    //  - Có cả date + cashierId → filter theo cả hai
    //  - Chỉ date hoặc chỉ cashierId → filter một chiều
    //  - Không có filter → lấy tất cả (phân trang)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public PageResponse<List<InvoiceResponse>> getInvoices(LocalDate date, UUID cashierId, Pageable pageable) {
        Page<Invoice> page;

        if (date != null && cashierId != null) {
            OffsetDateTime from = date.atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime to = date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
            page = invoiceRepository.findByCashierIdAndCreatedAtBetween(cashierId, from, to, pageable);
        } else if (date != null) {
            OffsetDateTime from = date.atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime to = date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
            page = invoiceRepository.findByCreatedAtBetween(from, to, pageable);
        } else if (cashierId != null) {
            page = invoiceRepository.findByCashierId(cashierId, pageable);
        } else {
            page = invoiceRepository.findAll(pageable);
        }

        List<InvoiceResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy chi tiết một hóa đơn theo id
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public InvoiceResponse getById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return mapToResponse(invoice);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERY: Lấy hóa đơn gắn với một order
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public InvoiceResponse getByOrderId(UUID orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "orderId", orderId));
        return mapToResponse(invoice);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VOID: Hủy hóa đơn kèm lý do
    //  1. Kiểm tra hóa đơn chưa bị void trước đó
    //  2. Cập nhật status = VOIDED, lưu voidReason và voidedBy
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public InvoiceResponse voidInvoice(UUID id, String reason, UUID voidedBy) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        // Bước 1: Không cho void lần hai
        if (invoice.getStatus() == InvoiceStatus.VOIDED) {
            throw new BusinessException("Hóa đơn đã được hủy trước đó");
        }

        // Bước 2: Ghi nhận thông tin hủy
        invoice.setStatus(InvoiceStatus.VOIDED);
        invoice.setVoidReason(reason);
        invoice.setVoidedBy(voidedBy);

        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRINT: Render hóa đơn HTML (Thymeleaf) để in tại quầy
    //  1. Lấy invoice, order, order items (bỏ món CANCELLED)
    //  2. Enrich thông tin cashier, bàn, khách hàng
    //  3. Bind biến vào template invoice/invoice.html
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public String generateInvoiceHtml(UUID id) {
        // Bước 1: Lấy dữ liệu cốt lõi
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        Order order = orderRepository.findById(invoice.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", invoice.getOrderId()));

        List<OrderItem> orderItems = orderItemRepository.findByOrder_Id(order.getId()).stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED)
                .collect(Collectors.toList());

        // Bước 2: Enrich thông tin hiển thị
        String cashierName = userRepository.findById(invoice.getCashierId())
                .map(User::getFullName)
                .orElse("N/A");

        String tableNumber = tableRepository.findById(order.getTableId())
                .map(Table::getNumber)
                .orElse("N/A");

        String customerName = null;
        Integer customerPoints = null;
        if (invoice.getCustomerId() != null) {
            Customer customer = customerRepository.findById(invoice.getCustomerId()).orElse(null);
            if (customer != null) {
                customerName = customer.getFullName();
                customerPoints = customer.getCurrentPoints();
            }
        }

        List<Map<String, Object>> items = orderItems.stream()
                .map(item -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("name", item.getItemName());
                    row.put("price", item.getUnitPrice());
                    row.put("quantity", item.getQuantity());
                    row.put("total", item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())));
                    return row;
                })
                .collect(Collectors.toList());

        // Bước 3: Bind context Thymeleaf và render HTML
        Context context = new Context();
        context.setVariable("invoiceNumber", invoice.getId().toString().substring(0, 8).toUpperCase());
        context.setVariable("createdAt", invoice.getCreatedAt() != null
                ? invoice.getCreatedAt().format(DISPLAY_DATETIME)
                : "");
        context.setVariable("cashierName", cashierName);
        context.setVariable("tableNumber", tableNumber);
        context.setVariable("customerName", customerName);
        context.setVariable("pointsEarned", invoice.getPointsEarned());
        context.setVariable("items", items);
        context.setVariable("subtotal", invoice.getSubtotal());
        context.setVariable("voucherDiscount", invoice.getDiscountAmount());
        context.setVariable("pointsDeducted", invoice.getPointsDeducted());
        context.setVariable("vatRate", invoice.getVatRate());
        context.setVariable("vatAmount", invoice.getVatAmount());
        context.setVariable("totalAmount", invoice.getTotalAmount());
        context.setVariable("paymentMethod", invoice.getPaymentMethod() != null
                ? invoice.getPaymentMethod().name()
                : "");
        context.setVariable("customerPoints", customerPoints);

        return templateEngine.process("invoice/invoice", context);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMAIL: Gửi hóa đơn qua email (chưa triển khai)
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void sendInvoiceEmail(UUID id) {
        logger.warn("sendInvoiceEmail chưa được triển khai cho invoice {}", id);
        throw new BusinessException("Chức năng gửi email hóa đơn chưa được triển khai");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER: Map Invoice entity → InvoiceResponse DTO
    //  - Lấy tên thu ngân từ UserRepository
    // ─────────────────────────────────────────────────────────────────────────
    private InvoiceResponse mapToResponse(Invoice invoice) {
        String cashierName = invoice.getCashierId() != null
                ? userRepository.findById(invoice.getCashierId()).map(User::getFullName).orElse(null)
                : null;

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .orderId(invoice.getOrderId())
                .cashierName(cashierName)
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .vatAmount(invoice.getVatAmount())
                .totalAmount(invoice.getTotalAmount())
                .paymentMethod(invoice.getPaymentMethod())
                .pointsUsed(invoice.getPointsUsed())
                .pointsEarned(invoice.getPointsEarned())
                .status(invoice.getStatus())
                .voidReason(invoice.getVoidReason())
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}