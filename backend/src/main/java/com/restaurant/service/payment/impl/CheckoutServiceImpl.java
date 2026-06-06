package com.restaurant.service.payment.impl;

import com.restaurant.common.enums.InvoiceStatus;
import com.restaurant.common.enums.OrderItemStatus;
import com.restaurant.common.enums.TableStatus;
import com.restaurant.common.enums.OrderStatus;
import com.restaurant.common.enums.PaymentMethod;
import com.restaurant.common.exceptions.BusinessException;
import com.restaurant.common.exceptions.ResourceNotFoundException;
import com.restaurant.common.utils.VnpayUtil;
import com.restaurant.dto.request.payment.CheckoutRequest;
import com.restaurant.dto.response.payment.CheckoutResponse;
import com.restaurant.dto.response.payment.CustomerSummary;
import com.restaurant.dto.response.payment.InvoiceResponse;
import com.restaurant.dto.response.payment.PaymentResponse;
import com.restaurant.dto.response.payment.VnpayCallbackResponse;
import com.restaurant.model.Customer;
import com.restaurant.model.Invoice;
import com.restaurant.model.Order;
import com.restaurant.model.OrderItem;
import com.restaurant.model.Table;
import com.restaurant.model.Voucher;
import com.restaurant.repository.*;
import com.restaurant.service.payment.CheckoutService;
import com.restaurant.service.payment.PointTransactionService;
import com.restaurant.service.payment.VnpayService;
import com.restaurant.service.payment.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CheckoutServiceImpl implements CheckoutService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherService voucherService;
    private final PointTransactionService pointTransactionService;
    private final VnpayService vnpayService;

    // Thuế VAT 10% — hardcode theo quy tắc nghiệp vụ
    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");
    // Quy đổi: 1 điểm = 1.000đ khi thanh toán
    private static final BigDecimal POINTS_TO_MONEY = new BigDecimal("1000");
    // Quy đổi: 10.000đ chi tiêu = 1 điểm tích lũy
    private static final int MONEY_PER_POINT = 10000;

    // ─────────────────────────────────────────────────────────────────────────
    // PREVIEW: Tính toán trước khi thanh toán (chưa tạo invoice, chưa trừ điểm)
    //  1. Kiểm tra order OPEN và chưa có invoice PAID
    //  2. Tính subtotal từ món SERVED
    //  3. Áp voucher + điểm khách hàng (nếu có)
    //  4. Tính VAT 10% và totalAmount
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public CheckoutResponse previewCheckout(CheckoutRequest request) {
        // Bước 1: Validate order
        Order order = getOpenOrder(request.getOrderId());
        assertNoPaidInvoice(order.getId());

        // Bước 2: Subtotal từ món đã phục vụ
        List<OrderItem> servedItems = getServedItems(order.getId());
        BigDecimal subtotal = calculateSubtotal(servedItems);

        // Bước 3: Customer + voucher
        Customer customer = findCustomer(request.getCustomerPhone());
        CustomerSummary customerSummary = toCustomerSummary(customer);

        BigDecimal discountAmount = BigDecimal.ZERO;
        String voucherCode = null;
        if (request.getVoucherId() != null) {
            String tierStr = customer != null ? customer.getTier() : null;
            Integer points = customer != null ? customer.getCurrentPoints() : null;
            discountAmount = voucherService.validateAndCalculateDiscount(
                    request.getVoucherId(), subtotal, tierStr, points);
            Voucher voucher = voucherRepository.findById(request.getVoucherId()).orElse(null);
            if (voucher != null) {
                voucherCode = voucher.getCode();
            }
        }

        // Bước 4: Tính điểm trừ (tối đa = subtotal - discount)
        int pointsUsed = 0;
        BigDecimal pointsDeducted = BigDecimal.ZERO;
        if (request.getPointsToUse() != null && request.getPointsToUse() > 0 && customer != null) {
            pointsUsed = Math.min(request.getPointsToUse(), customer.getCurrentPoints());
            pointsDeducted = BigDecimal.valueOf(pointsUsed).multiply(POINTS_TO_MONEY);
            BigDecimal maxDeduct = subtotal.subtract(discountAmount);
            if (pointsDeducted.compareTo(maxDeduct) > 0) {
                pointsDeducted = maxDeduct;
                pointsUsed = pointsDeducted.divide(POINTS_TO_MONEY, 0, RoundingMode.DOWN).intValue();
            }
        }

        // VAT + total + điểm tích lũy
        BigDecimal afterDiscount = subtotal.subtract(discountAmount).subtract(pointsDeducted);
        BigDecimal vatAmount = afterDiscount.multiply(VAT_RATE).setScale(0, RoundingMode.HALF_UP);
        BigDecimal totalAmount = afterDiscount.add(vatAmount);

        int pointsEarned = customer != null
                ? totalAmount.divide(BigDecimal.valueOf(MONEY_PER_POINT), 0, RoundingMode.DOWN).intValue()
                : 0;

        return CheckoutResponse.builder()
                .orderId(order.getId())
                .subtotal(subtotal)
                .voucherCode(voucherCode)
                .voucherDiscount(discountAmount)
                .pointsUsed(pointsUsed)
                .pointsDeducted(pointsDeducted)
                .vatRate(VAT_RATE)
                .vatAmount(vatAmount)
                .totalAmount(totalAmount)
                .customer(customerSummary)
                .pointsEarned(pointsEarned)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASH: Thanh toán tiền mặt và chốt hóa đơn ngay
    //  1. Chặn nếu order đang chờ VNPay (PENDING)
    //  2. Preview + validate cashReceived >= totalAmount
    //  3. Tạo invoice PAID, trừ/tích điểm, tăng voucher usedCount
    //  4. Đóng order → PAID
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public InvoiceResponse processCashPayment(CheckoutRequest request, UUID cashierId) {
        assertNoPendingInvoice(request.getOrderId());
        CheckoutResponse preview = previewCheckout(request);

        // Bước 2: Kiểm tra tiền khách đưa (nếu null thì tự động lấy bằng totalAmount)
        if (request.getCashReceived() == null) {
            request.setCashReceived(preview.getTotalAmount());
        } else if (request.getCashReceived().compareTo(preview.getTotalAmount()) < 0) {
            throw new BusinessException("Số tiền nhận không đủ. Cần: " + preview.getTotalAmount());
        }

        // Bước 3: Tạo invoice và side effects
        Customer customer = findCustomer(request.getCustomerPhone());
        Invoice invoice = buildInvoice(request, preview, cashierId, customer, PaymentMethod.CASH, InvoiceStatus.PAID);
        invoice = invoiceRepository.save(invoice);

        applyPaymentSideEffects(invoice, preview, customer, cashierId, request.getVoucherId());

        // Bước 4: Đóng order
        closeOrder(invoice.getOrderId());

        BigDecimal changeAmount = request.getCashReceived().subtract(preview.getTotalAmount());
        return toInvoiceResponse(invoice, preview.getVoucherCode(), changeAmount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VNPAY CREATE: Tạo invoice PENDING + URL redirect VNPay
    //  1. Preview tính tiền
    //  2. Reuse invoice PENDING nếu đã có, ngược lại tạo mới + vnpTxnRef
    //  3. Gọi VnpayService tạo paymentUrl ký HMAC
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public PaymentResponse createVnpayPayment(CheckoutRequest request, UUID cashierId, String ipAddress, String bankCode) {
        CheckoutResponse preview = previewCheckout(request);
        Customer customer = findCustomer(request.getCustomerPhone());

        // Bước 2: Tìm hoặc tạo invoice PENDING
        Optional<Invoice> existingPending = invoiceRepository.findByOrderId(request.getOrderId())
                .filter(inv -> inv.getStatus() == InvoiceStatus.PENDING);

        Invoice invoice = existingPending.orElseGet(() -> {
            Invoice pending = buildInvoice(request, preview, cashierId, customer, PaymentMethod.VNPAY, InvoiceStatus.PENDING);
            pending = invoiceRepository.save(pending);
            pending.setVnpTxnRef(VnpayUtil.toTxnRef(pending.getId()));
            return invoiceRepository.save(pending);
        });

        if (existingPending.isPresent()) {
            invoice.setSubtotal(preview.getSubtotal());
            invoice.setVoucherId(request.getVoucherId());
            invoice.setDiscountAmount(preview.getVoucherDiscount());
            invoice.setPointsUsed(preview.getPointsUsed());
            invoice.setPointsDeducted(preview.getPointsDeducted());
            invoice.setVatRate(preview.getVatRate());
            invoice.setVatAmount(preview.getVatAmount());
            invoice.setTotalAmount(preview.getTotalAmount());
            invoice.setCustomerId(customer != null ? customer.getId() : null);
            invoice.setCustomerPhone(request.getCustomerPhone());
            invoice.setPointsEarned(preview.getPointsEarned());
            if (invoice.getVnpTxnRef() == null) {
                invoice.setVnpTxnRef(VnpayUtil.toTxnRef(invoice.getId()));
            }
            invoice = invoiceRepository.save(invoice);
        }

        // Bước 3: Tạo URL thanh toán VNPay
        String paymentUrl = vnpayService.createPaymentUrl(
                invoice.getId(), preview.getTotalAmount(), ipAddress, bankCode);

        return PaymentResponse.builder()
                .invoiceId(invoice.getId())
                .paymentUrl(paymentUrl)
                .amount(preview.getTotalAmount())
                .orderInfo("Thanh toan hoa don " + invoice.getId())
                .transactionId(invoice.getVnpTxnRef())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VNPAY CONFIRM: Xử lý callback/IPN từ VNPay
    //  1. Verify chữ ký HMAC-SHA512
    //  2. Tra invoice theo vnp_TxnRef — idempotent nếu đã PAID
    //  3. responseCode != 00 → void invoice PENDING
    //  4. responseCode == 00 → kiểm tra amount, chốt PAID + side effects
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public VnpayCallbackResponse confirmVnpayPayment(Map<String, String> params) {
        // Bước 1: Verify chữ ký
        if (!vnpayService.verifySignature(params)) {
            return VnpayCallbackResponse.builder()
                    .success(false)
                    .responseCode(params.get("vnp_ResponseCode"))
                    .message("Chữ ký VNPay không hợp lệ")
                    .build();
        }

        // Bước 2: Tra cứu invoice
        String txnRef = params.get("vnp_TxnRef");
        Invoice invoice = invoiceRepository.findByVnpTxnRef(txnRef)
                .orElseGet(() -> invoiceRepository.findById(VnpayUtil.fromTxnRef(txnRef))
                        .orElseThrow(() -> new ResourceNotFoundException("Invoice", "vnpTxnRef", txnRef)));

        // Idempotent: đã PAID → trả success
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            return VnpayCallbackResponse.builder()
                    .success(true)
                    .responseCode("00")
                    .message("Hóa đơn đã được thanh toán trước đó")
                    .invoiceId(invoice.getId())
                    .orderId(invoice.getOrderId())
                    .build();
        }

        if (invoice.getStatus() != InvoiceStatus.PENDING) {
            throw new BusinessException("Hóa đơn không ở trạng thái chờ thanh toán");
        }

        String responseCode = params.get("vnp_ResponseCode");
        // Bước 3: Thanh toán thất bại → void invoice
        if (!"00".equals(responseCode)) {
            invoice.setStatus(InvoiceStatus.VOIDED);
            invoice.setVoidReason("VNPay thất bại: " + responseCode);
            invoiceRepository.save(invoice);
            return VnpayCallbackResponse.builder()
                    .success(false)
                    .responseCode(responseCode)
                    .message("Thanh toán VNPay thất bại")
                    .invoiceId(invoice.getId())
                    .orderId(invoice.getOrderId())
                    .build();
        }

        // Bước 4: Kiểm tra số tiền khớp (VNPay gửi amount × 100)
        long expectedAmount = VnpayUtil.toVnpAmount(invoice.getTotalAmount());
        long paidAmount = Long.parseLong(params.get("vnp_Amount"));
        if (expectedAmount != paidAmount) {
            throw new BusinessException("Số tiền VNPay không khớp với hóa đơn");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(OffsetDateTime.now());
        invoice.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        invoiceRepository.save(invoice);

        // Side effects giống cash: điểm, voucher, đóng order
        Customer customer = invoice.getCustomerId() != null
                ? customerRepository.findById(invoice.getCustomerId()).orElse(null)
                : findCustomer(invoice.getCustomerPhone());

        CheckoutResponse preview = CheckoutResponse.builder()
                .subtotal(invoice.getSubtotal())
                .voucherDiscount(invoice.getDiscountAmount())
                .pointsUsed(invoice.getPointsUsed())
                .pointsDeducted(invoice.getPointsDeducted())
                .pointsEarned(invoice.getPointsEarned())
                .totalAmount(invoice.getTotalAmount())
                .build();

        applyPaymentSideEffects(invoice, preview, customer, invoice.getCashierId(), invoice.getVoucherId());
        closeOrder(invoice.getOrderId());

        return VnpayCallbackResponse.builder()
                .success(true)
                .responseCode("00")
                .message("Thanh toán VNPay thành công")
                .invoiceId(invoice.getId())
                .orderId(invoice.getOrderId())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Lấy order OPEN — ném lỗi nếu không tồn tại hoặc đã đóng */
    private Order getOpenOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Order không ở trạng thái mở. Status hiện tại: " + order.getStatus());
        }
        return order;
    }

    /** Chỉ chặn preview khi đã có invoice PAID (PENDING vẫn cho preview lại) */
    private void assertNoPaidInvoice(UUID orderId) {
        invoiceRepository.findByOrderId(orderId).ifPresent(inv -> {
            if (inv.getStatus() == InvoiceStatus.PAID) {
                throw new BusinessException("Order đã được thanh toán");
            }
        });
    }

    /** Cash không được chạy khi order đang chờ VNPay */
    private void assertNoPendingInvoice(UUID orderId) {
        invoiceRepository.findByOrderId(orderId).ifPresent(inv -> {
            if (inv.getStatus() == InvoiceStatus.PENDING) {
                throw new BusinessException("Order đang chờ thanh toán VNPay");
            }
        });
    }

    /** Tính tiền cho tất cả các món không bị huỷ (CANCELLED) */
    private List<OrderItem> getServedItems(UUID orderId) {
        List<OrderItem> items = orderItemRepository.findByOrder_Id(orderId).stream()
                .filter(item -> item.getStatus() != OrderItemStatus.CANCELLED)
                .collect(Collectors.toList());
        if (items.isEmpty()) {
            throw new BusinessException("Không có món nào hợp lệ để thanh toán");
        }
        return items;
    }

    private BigDecimal calculateSubtotal(List<OrderItem> servedItems) {
        return servedItems.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Customer findCustomer(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return customerRepository.findByPhone(phone).orElse(null);
    }

    private CustomerSummary toCustomerSummary(Customer customer) {
        if (customer == null) {
            return null;
        }
        return CustomerSummary.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .tier(customer.getTier())
                .currentPoints(customer.getCurrentPoints())
                .totalSpent(customer.getTotalSpent())
                .build();
    }

    private Invoice buildInvoice(CheckoutRequest request, CheckoutResponse preview, UUID cashierId,
                                 Customer customer, PaymentMethod paymentMethod, InvoiceStatus status) {
        return Invoice.builder()
                .orderId(request.getOrderId())
                .cashierId(cashierId)
                .subtotal(preview.getSubtotal())
                .voucherId(request.getVoucherId())
                .discountAmount(preview.getVoucherDiscount())
                .pointsUsed(preview.getPointsUsed())
                .pointsDeducted(preview.getPointsDeducted())
                .vatRate(preview.getVatRate())
                .vatAmount(preview.getVatAmount())
                .totalAmount(preview.getTotalAmount())
                .paymentMethod(paymentMethod)
                .customerId(customer != null ? customer.getId() : null)
                .customerPhone(request.getCustomerPhone())
                .pointsEarned(preview.getPointsEarned())
                .status(status)
                .paidAt(status == InvoiceStatus.PAID ? OffsetDateTime.now() : null)
                .build();
    }

    /** Sau khi PAID: trừ/tích điểm khách, tăng voucher usedCount */
    private void applyPaymentSideEffects(Invoice invoice, CheckoutResponse preview, Customer customer,
                                         UUID actorId, UUID voucherId) {
        if (customer != null) {
            if (preview.getPointsUsed() > 0) {
                pointTransactionService.redeemPoints(
                        customer.getId(), invoice.getId(), preview.getPointsUsed(), actorId);
            }
            if (preview.getPointsEarned() > 0) {
                pointTransactionService.earnPoints(
                        customer.getId(), invoice.getId(), preview.getPointsEarned(), actorId);
            }
            customer.setTotalSpent(customer.getTotalSpent().add(preview.getTotalAmount()));
            customerRepository.save(customer);
        }

        if (voucherId != null) {
            Voucher voucher = voucherRepository.findById(voucherId).orElse(null);
            if (voucher != null) {
                voucher.setUsedCount(voucher.getUsedCount() + 1);
                voucherRepository.save(voucher);
            }
        }
    }

    /** Cập nhật order → PAID, ghi closedAt, bàn → CLEANING */
    private void closeOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.PAID);
        order.setClosedAt(OffsetDateTime.now());
        orderRepository.save(order);

        tableRepository.findById(order.getTableId()).ifPresent(table -> {
            // table is already inactive, computeStatus will return CLEANING
            tableRepository.save(table);
        });
    }

    /** Map Invoice → InvoiceResponse (kèm tiền thối nếu cash) */
    private InvoiceResponse toInvoiceResponse(Invoice inv, String voucherCode, BigDecimal changeAmount) {
        return InvoiceResponse.builder()
                .id(inv.getId())
                .orderId(inv.getOrderId())
                .cashierId(inv.getCashierId())
                .subtotal(inv.getSubtotal())
                .voucherCode(voucherCode)
                .discountAmount(inv.getDiscountAmount())
                .pointsUsed(inv.getPointsUsed())
                .pointsDeducted(inv.getPointsDeducted())
                .vatRate(inv.getVatRate())
                .vatAmount(inv.getVatAmount())
                .totalAmount(inv.getTotalAmount())
                .paymentMethod(inv.getPaymentMethod())
                .customerId(inv.getCustomerId())
                .customerPhone(inv.getCustomerPhone())
                .pointsEarned(inv.getPointsEarned())
                .status(inv.getStatus())
                .voidReason(inv.getVoidReason())
                .voidedBy(inv.getVoidedBy())
                .createdAt(inv.getCreatedAt())
                .changeAmount(changeAmount)
                .build();
    }
}
