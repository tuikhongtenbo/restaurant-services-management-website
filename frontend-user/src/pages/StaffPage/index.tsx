import { useState, useEffect, useCallback } from "react";
import Header from "../../component/layouts/Header/Header";
import { useAuth } from "../../context/AuthContext";
import { tableService, type RestaurantTable } from "../../services/tableService";
import { orderService, type OrderResponse } from "../../services/orderService";
import { invoiceService, type InvoiceResponse, type CheckoutResponse } from "../../services/invoiceService";
import { reservationService, type ReservationResponse, type ReservationCalendarResponse } from "../../services/reservationService";
import { useMenu } from "../../hooks/useMenu";
import type { MenuItem } from "../../types/menu";
import { useNavigate } from "react-router-dom";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import { voucherService, type VoucherResponse } from "../../services/voucherService";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string;
}

// Lấy staffId từ JWT token
function getStaffIdFromToken(): string | null {
  const token = localStorage.getItem("authToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.userId || payload.id || null;
  } catch {
    return null;
  }
}

export default function StaffPage() {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const navigate = useNavigate();
  const { menu, loading: menuLoading } = useMenu();

  // ─── State bàn ───────────────────────────────────────────────
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // ─── State order / giỏ hàng ──────────────────────────────────
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestCount, setGuestCount] = useState(2);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ─── State menu/filter ───────────────────────────────────────
  const [searchMenu, setSearchMenu] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ─── State tabs ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"tables" | "order" | "reservations">("tables");

  // ─── State đặt bàn ───────────────────────────────────────────
  const [reservationsDate, setReservationsDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [allReservations, setAllReservations] = useState<ReservationResponse[]>([]);
  const [pendingReservations, setPendingReservations] = useState<ReservationResponse[]>([]);
  const [calendar, setCalendar] = useState<ReservationCalendarResponse | null>(null);
  const [reservationsLoading, setReservationsLoading] = useState(false);


  // ─── State hoá đơn ───────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<InvoiceResponse | null>(null);
  const [systemAlert, setSystemAlert] = useState<{ title: string; message: string } | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutResponse | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherResponse | null>(null);

  // ─── State thao tác bàn ──────────────────────────────────────
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [closeTableConfirm, setCloseTableConfirm] = useState<RestaurantTable | null>(null);

  // ════════════════════════════════════════════════════════════
  // LOAD DATA
  // ════════════════════════════════════════════════════════════
  const loadTables = useCallback(async () => {
    setTablesLoading(true);
    try {
      const data = await tableService.getTables();
      setTables(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bàn", err);
    } finally {
      setTablesLoading(false);
    }
  }, []);

  const loadReservations = useCallback(async () => {
    setReservationsLoading(true);
    try {
      const [allRes, cal] = await Promise.all([
        reservationService.getReservations(showAllReservations ? undefined : reservationsDate),
        reservationService.getCalendar(reservationsDate),
      ]);
      setAllReservations(allRes);
      setPendingReservations(allRes.filter((r) => r.status === "PENDING"));
      setCalendar(cal);
    } catch (err) {
      console.error("loadReservations error:", err);
    } finally {
      setReservationsLoading(false);
    }
  }, [reservationsDate, showAllReservations]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !isStaff) {
      navigate("/login");
      return;
    }
    loadTables();
    loadReservations();
  }, [isLoading, isAuthenticated, isStaff, navigate, loadTables, loadReservations]);

  // ════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════
  const isTableServing = (t: RestaurantTable) => t.status === "SERVING";
  const isTableEmpty   = (t: RestaurantTable) => t.status === "EMPTY";
  const isTablePaid    = (t: RestaurantTable) => t.status === "CLEANING";

  // ════════════════════════════════════════════════════════════
  // HANDLER: Chọn bàn → chuyển sang tab gọi món, load order
  // ════════════════════════════════════════════════════════════
  const handleSelectTable = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setCart([]);
    setOrderError(null);
    setOrderSuccess(false);
    setInvoiceHtml(null);
    setLastInvoice(null);
    setVoucherCodeInput("");
    setAppliedVoucher(null);
    setActiveTab("order");

    if (isTableServing(table)) {
      try {
        const order = await orderService.getOpenOrderByTable(table.id);
        setCurrentOrder(order);
      } catch {
        setCurrentOrder(null);
      }
    } else {
      setCurrentOrder(null);
    }
  };

  // ════════════════════════════════════════════════════════════
  // HANDLER: Mở bàn (EMPTY → SERVING)
  // ════════════════════════════════════════════════════════════
  const handleOpenTable = async (table: RestaurantTable) => {
    if (!isTableEmpty(table)) {
      setSystemAlert({ title: "Thông báo", message: "Bàn phải đang trống mới mở được!" });
      return;
    }
    setTableActionLoading(true);
    try {
      const newOrder = await orderService.createOrder({
        tableId: table.id,
        guestCount,
      });
      await loadTables();
      const updated = { ...table, status: "SERVING" };
      setSelectedTable(updated);
      setCurrentOrder(newOrder);
    } catch (err) {
      setSystemAlert({ title: "Lỗi mở bàn", message: (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // HANDLER: Đóng bàn (SERVING → EMPTY, chỉ khi đã thanh toán)
  // ════════════════════════════════════════════════════════════
  const handleCloseTable = async (table: RestaurantTable) => {
    if (!isTableServing(table) && !isTablePaid(table)) {
      setSystemAlert({ title: "Thông báo", message: "Bàn không đang phục vụ hoặc không phải vừa thanh toán xong!" });
      return;
    }
    // Kiểm tra có order chưa thanh toán không
    let openOrder: OrderResponse | null = null;
    try { openOrder = await orderService.getOpenOrderByTable(table.id); } catch { /* no order */ }

    if (openOrder) {
      setSystemAlert({ title: "Cảnh báo", message: "Bàn còn hoá đơn chưa thanh toán! Vui lòng thanh toán trước." });
      return;
    }
    
    // Thay vì window.confirm, ta dùng modal
    setCloseTableConfirm(table);
  };

  const handleCloseTableConfirm = async () => {
    if (!closeTableConfirm) return;
    const table = closeTableConfirm;
    setCloseTableConfirm(null);

    setTableActionLoading(true);
    try {
      await tableService.closeTable(table.id);
      await loadTables();
      if (selectedTable && selectedTable.id === table.id) {
        setSelectedTable({ ...table, status: "EMPTY" });
        setCurrentOrder(null);
        setCart([]);
        setLastInvoice(null);
      }
    } catch (err) {
      setSystemAlert({ title: "Lỗi đóng bàn", message: (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // HANDLER: Xác nhận gọi món
  // - Bàn phải đang SERVING
  // - Lấy order hiện tại (hoặc tạo mới nếu chưa có)
  // - Chỉ addItem vào order, KHÔNG tạo order mới nếu đã có
  // ════════════════════════════════════════════════════════════
  const handleConfirmOrder = async () => {
    if (!selectedTable || cart.length === 0) return;
    if (!isTableServing(selectedTable)) {
      setOrderError("Bàn phải đang phục vụ mới gọi được món! Hãy mở bàn trước.");
      return;
    }

    setOrderLoading(true);
    setOrderError(null);
    setOrderSuccess(false);

    try {
      // Bước 1: lấy order đang OPEN của bàn
      let order = currentOrder;
      if (!order) {
        try {
          // Thử lấy order đang mở trước
          order = await orderService.getOpenOrderByTable(selectedTable.id);
        } catch {
          // Bàn SERVING nhưng chưa có order → tạo mới
          order = await orderService.createOrder({
            tableId: selectedTable.id,
            guestCount,
          });
        }
        setCurrentOrder(order);
      }

      // Bước 2: thêm từng món vào order (addItem)
      for (const c of cart) {
        await orderService.addOrderItem(order.id, {
          itemId: c.menuItem.id,
          quantity: c.quantity,
          note: c.note || "",
        });
      }

      // Bước 3: reload order để hiển thị đầy đủ
      const updated = await orderService.getOpenOrderByTable(selectedTable.id);
      setCurrentOrder(updated);

      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Có lỗi xảy ra";
      setOrderError(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // HANDLER: Thanh toán & xuất hoá đơn
  // ════════════════════════════════════════════════════════════
  const handleCheckoutClick = async () => {
    if (!currentOrder) {
      setSystemAlert({ title: "Thông báo", message: "Không có đơn hàng nào để thanh toán!" });
      return;
    }
    setCheckoutLoading(true);
    try {
      const preview = await invoiceService.previewCheckout({
        orderId: currentOrder.id,
        voucherId: appliedVoucher?.id || undefined,
      });
      setCheckoutPreview(preview);
      setCashReceived(preview.totalAmount);
      setCheckoutModalOpen(true);
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: (err as Error).message });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePreviewRefresh = async () => {
    if (!currentOrder) return;
    try {
      const preview = await invoiceService.previewCheckout({
        orderId: currentOrder.id,
        customerPhone: customerPhone || undefined,
        voucherId: appliedVoucher?.id || undefined,
      });
      setCheckoutPreview(preview);
      setCashReceived(preview.totalAmount);
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: (err as Error).message });
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      setSystemAlert({ title: "Thông báo", message: "Vui lòng nhập mã voucher" });
      return;
    }
    if (!currentOrder) return;
    setCheckoutLoading(true);
    try {
      const v = await voucherService.getByCode(voucherCodeInput.trim());
      setAppliedVoucher(v);
      setSystemAlert({ title: "Thành công", message: "Áp dụng voucher thành công!" });
      
      const preview = await invoiceService.previewCheckout({
        orderId: currentOrder.id,
        customerPhone: customerPhone || undefined,
        voucherId: v.id,
      });
      setCheckoutPreview(preview);
      setCashReceived(preview.totalAmount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Mã voucher không hợp lệ hoặc đã hết hạn";
      setSystemAlert({ title: "Lỗi", message: msg });
      setAppliedVoucher(null);
      
      try {
        const preview = await invoiceService.previewCheckout({
          orderId: currentOrder.id,
          customerPhone: customerPhone || undefined,
        });
        setCheckoutPreview(preview);
        setCashReceived(preview.totalAmount);
      } catch (e) {
        // Ignore
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRemoveVoucher = async () => {
    if (!currentOrder) return;
    setVoucherCodeInput("");
    setAppliedVoucher(null);
    setCheckoutLoading(true);
    try {
      const preview = await invoiceService.previewCheckout({
        orderId: currentOrder.id,
        customerPhone: customerPhone || undefined,
        voucherId: undefined,
      });
      setCheckoutPreview(preview);
      setCashReceived(preview.totalAmount);
      setSystemAlert({ title: "Thông báo", message: "Đã huỷ áp dụng voucher" });
    } catch (e) {
      // Ignore
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutCash = async () => {
    if (!currentOrder) return;
    setCheckoutLoading(true);
    try {
      const invoice = await invoiceService.checkoutCash({
        orderId: currentOrder.id,
        customerPhone: customerPhone || undefined,
        cashReceived: cashReceived,
        voucherId: appliedVoucher?.id || undefined,
      });
      setLastInvoice(invoice);

      try {
        const html = await invoiceService.getInvoiceHtml(invoice.id);
        setInvoiceHtml(html);
      } catch {}

      setSystemAlert({ title: "Thành công", message: "Thanh toán thành công" });
      setCheckoutModalOpen(false);

      await loadTables();
      setCurrentOrder(null);
      setCart([]);
      if (selectedTable) {
        setSelectedTable({ ...selectedTable, status: "CLEANING" });
      }
    } catch (err) {
      setSystemAlert({ title: "Lỗi thanh toán", message: (err as Error).message });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutVnpay = async () => {
    if (!currentOrder) return;
    setCheckoutLoading(true);
    try {
      const res = await invoiceService.createVnpayPayment({
        orderId: currentOrder.id,
        customerPhone: customerPhone || undefined,
        voucherId: appliedVoucher?.id || undefined,
      });
      window.location.href = res.paymentUrl;
    } catch (err) {
      setSystemAlert({ title: "Lỗi VNPay", message: (err as Error).message });
      setCheckoutLoading(false);
    }
  };

  // In hoá đơn
  const handlePrintInvoice = async () => {
    if (!lastInvoice) return;
    try {
      await invoiceService.printInvoice(lastInvoice.id);
    } catch (err) {
      setSystemAlert({ title: "Lỗi in hoá đơn", message: (err as Error).message });
    }
  };

  // ════════════════════════════════════════════════════════════
  // HANDLER: Xác nhận đặt bàn (gửi X-Staff-ID)
  // ════════════════════════════════════════════════════════════
  const handleConfirmReservation = async (res: ReservationResponse) => {
    const staffId = getStaffIdFromToken();
    if (!staffId) {
      setSystemAlert({ title: "Lỗi", message: "Không lấy được ID nhân viên, vui lòng đăng nhập lại." });
      return;
    }
    setTableActionLoading(true);
    try {
      await reservationService.confirmReservation(res.id, staffId, "");
      await loadReservations();
      await loadTables();
      setSystemAlert({ title: "Thành công", message: "Đã xác nhận đặt bàn thành công!" });
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: "Lỗi khi duyệt: " + (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleRejectReservation = async (res: ReservationResponse) => {
    const reason = window.prompt("Lý do từ chối:");
    if (reason === null) return;
    setTableActionLoading(true);
    try {
      await reservationService.rejectReservation(res.id, reason);
      await loadReservations();
      setSystemAlert({ title: "Thành công", message: "Đã từ chối đặt bàn" });
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: "Lỗi khi từ chối: " + (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleArrivedReservation = async (res: ReservationResponse) => {
    const today = new Date().toISOString().split("T")[0];
    const resDate = new Date(res.reservedAt).toISOString().split("T")[0];
    if (today !== resDate) {
      setSystemAlert({ title: "Cảnh báo", message: "Chỉ được check-in vào đúng ngày đặt bàn!" });
      return;
    }

    setTableActionLoading(true);
    try {
      await reservationService.arrivedReservation(res.id);
      await loadReservations();
      await loadTables();
      setSystemAlert({ title: "Thành công", message: "Khách đã đến" });
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: "Lỗi cập nhật khách đến: " + (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleNoShowReservation = async (res: ReservationResponse) => {
    if (!window.confirm("Xác nhận khách không đến? Bàn sẽ được giải phóng.")) return;
    setTableActionLoading(true);
    try {
      await reservationService.noShowReservation(res.id);
      await loadReservations();
      await loadTables();
      setSystemAlert({ title: "Thành công", message: "Đã ghi nhận khách không đến" });
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: "Lỗi ghi nhận: " + (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleCancelReservation = async (res: ReservationResponse) => {
    const reason = window.prompt("Lý do huỷ:");
    if (reason === null) return;
    setTableActionLoading(true);
    try {
      await reservationService.cancelReservation(res.id, reason);
      await loadReservations();
      await loadTables();
      setSystemAlert({ title: "Thành công", message: "Đã huỷ đặt bàn" });
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: "Lỗi huỷ: " + (err as Error).message });
    } finally {
      setTableActionLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // CART HELPERS
  // ════════════════════════════════════════════════════════════
  const addToCart = (item: MenuItem) => {
    if (!selectedTable || !isTableServing(selectedTable)) {
      setSystemAlert({ title: "Cảnh báo", message: "Chỉ bàn đang phục vụ mới gọi được món! Hãy mở bàn trước." });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1, note: "" }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.menuItem.id === itemId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    );
  };

  const updateNote = (itemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) => c.menuItem.id === itemId ? { ...c, note } : c)
    );
  };

  const totalCartPrice = cart.reduce((sum, c) => {
    const price = c.menuItem.promoPrice ?? c.menuItem.promo_price ?? c.menuItem.price;
    return sum + price * c.quantity;
  }, 0);

  const totalCartItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  // ════════════════════════════════════════════════════════════
  // UI HELPERS
  // ════════════════════════════════════════════════════════════
  const categories = ["all", ...Array.from(new Set(menu.map((i) => i.category)))];

  const filteredMenu = menu.filter((item) => {
    const matchCat = selectedCategory === "all" || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchMenu.toLowerCase());
    return matchCat && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EMPTY": return "#22c55e"; 
      case "SERVING": return "#f59e0b"; 
      case "CLEANING": return "#a78bfa"; 
      case "RESERVED": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "EMPTY": return "Trống";
      case "SERVING": return "Đang phục vụ";
      case "CLEANING": return "Chờ dọn dẹp";
      case "RESERVED": return "Đã đặt";
      default: return status;
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={styles.page}>
      <HeroBackground />
      <Header />
      <div className={styles.content}>

        {/* ── Sidebar ────────────────────────────────────────── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>🍽️ Quản lý</div>

          <button
            className={`${styles.tabBtn} ${activeTab === "tables" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("tables")}
          >
            🪑 Danh sách bàn
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "order" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("order")}
          >
            📋 Gọi món
            {totalCartItems > 0 && <span className={styles.cartBadge}>{totalCartItems}</span>}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === "reservations" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("reservations")}
          >
            📅 Quản lý đặt bàn
            {pendingReservations.length > 0 && (
              <span className={styles.cartBadge}>{pendingReservations.length}</span>
            )}
          </button>

          {selectedTable && activeTab === "order" && (
            <div className={styles.selectedTableInfo}>
              <div className={styles.selectedTableLabel}>Bàn đang chọn:</div>
              <div className={styles.selectedTableNumber}>Bàn {selectedTable.number}</div>
              <div className={styles.selectedTableArea}>{selectedTable.area}</div>
              <div className={styles.selectedTableStatus} style={{ color: getStatusColor(selectedTable.status) }}>
                ● {getStatusLabel(selectedTable.status)}
              </div>
              {currentOrder && (
                <div className={styles.currentOrderBadge}>
                  📋 Order #{currentOrder.id.slice(0, 8)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Main ───────────────────────────────────────────── */}
        <div className={styles.main}>

          {/* ════ TAB: DANH SÁCH BÀN ════ */}
          {activeTab === "tables" && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>🪑 Danh sách bàn</h2>
                <button className={styles.refreshBtn} onClick={loadTables} disabled={tablesLoading}>
                  🔄 Làm mới
                </button>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap", fontSize: "13px" }}>
                <span style={{ color: "#22c55e" }}>● OPEN (Trống)</span>
                <span style={{ color: "#f59e0b" }}>● SERVING (Đang phục vụ)</span>
                <span style={{ color: "#a78bfa" }}>● PAID (Đã thanh toán)</span>
                <span style={{ color: "#3b82f6" }}>● Đã đặt</span>
              </div>

              {tablesLoading ? (
                <div className={styles.loading}>Đang tải...</div>
              ) : (
                <div className={styles.tableGrid}>
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className={`${styles.tableCard} ${selectedTable?.id === table.id ? styles.tableCardSelected : ""}`}
                    >
                      <div className={styles.tableCardNumber}>Bàn {table.number}</div>
                      <div className={styles.tableCardCapacity}>👥 {table.capacity} khách</div>
                      <div className={styles.tableCardArea}>📍 {table.area ?? "—"}</div>
                      <div
                        className={styles.tableCardStatus}
                        style={{ backgroundColor: getStatusColor(table.status) + "22", color: getStatusColor(table.status) }}
                      >
                        ● {getStatusLabel(table.status)}
                      </div>

                      <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                        {isTableEmpty(table) && (
                          <button
                            className={styles.openTableBtn}
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                            onClick={() => handleOpenTable(table)}
                            disabled={tableActionLoading}
                          >
                            🟢 Mở bàn
                          </button>
                        )}
                        {isTableServing(table) && (
                          <>
                            <button
                              className={styles.resConfirmBtn}
                              style={{ fontSize: "12px", padding: "4px 10px" }}
                              onClick={() => handleSelectTable(table)}
                            >
                              📋 Gọi món
                            </button>
                            <button
                              className={styles.closeTableBtn}
                              style={{ fontSize: "12px", padding: "4px 10px" }}
                              onClick={() => handleCloseTable(table)}
                              disabled={tableActionLoading}
                            >
                              🔴 Hủy bàn
                            </button>
                          </>
                        )}
                        {isTablePaid(table) && (
                          <button
                            className={styles.closeTableBtn}
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                            onClick={() => handleCloseTable(table)}
                            disabled={tableActionLoading}
                          >
                            🧹 Dọn xong (Trống)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB: GỌI MÓN ════ */}
          {activeTab === "order" && (
            <div className={styles.orderLayout}>

              {/* Cột menu trái */}
              <div className={styles.menuSection}>
                <h2 className={styles.sectionTitle}>
                  📋 Thực đơn
                  {selectedTable && <span className={styles.forTable}> — Bàn {selectedTable.number}</span>}
                </h2>

                {/* Cảnh báo nếu chưa chọn bàn hoặc bàn chưa mở */}
                {!selectedTable && (
                  <div className={styles.warningBox}>
                    ⚠️ Vui lòng chọn bàn trước
                    <button className={styles.selectTableBtn} onClick={() => setActiveTab("tables")}>
                      Chọn bàn
                    </button>
                  </div>
                )}
                {selectedTable && !isTableServing(selectedTable) && (
                  <div className={styles.warningBox}>
                    ⚠️ Bàn {selectedTable.number} đang <strong>{getStatusLabel(selectedTable.status)}</strong>.
                    Chỉ bàn đang phục vụ mới gọi được món.
                    {isTableEmpty(selectedTable) && (
                      <button
                        className={styles.openTableBtn}
                        onClick={() => handleOpenTable(selectedTable)}
                        disabled={tableActionLoading}
                      >
                        🟢 Mở bàn ngay
                      </button>
                    )}
                  </div>
                )}

                {/* Filter */}
                <div className={styles.menuFilters}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm món..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.categoryTabs}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        className={`${styles.catBtn} ${selectedCategory === cat ? styles.catActive : ""}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === "all" ? "Tất cả" : cat.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid món ăn */}
                {menuLoading ? (
                  <div className={styles.loading}>Đang tải thực đơn...</div>
                ) : (
                  <div className={styles.menuGrid}>
                    {filteredMenu.map((item) => {
                      const inCart = cart.find((c) => c.menuItem.id === item.id);
                      const displayPrice = item.promoPrice ?? item.promo_price ?? item.price;
                      const canOrder = selectedTable && isTableServing(selectedTable);
                      return (
                        <div key={item.id} className={styles.menuCard}>
                          {(item.imageUrl ?? item.image_url) && (
                            <img src={item.imageUrl ?? item.image_url} alt={item.name} className={styles.menuImage} />
                          )}
                          <div className={styles.menuCardBody}>
                            <div className={styles.menuCat}>{item.category.replace(/_/g, " ")}</div>
                            <div className={styles.menuName}>{item.name}</div>
                            <div className={styles.menuDesc}>{item.description}</div>
                            <div className={styles.menuPrice}>
                              {(item.promoPrice ?? item.promo_price) ? (
                                <>
                                  <span className={styles.promoPrice}>{displayPrice.toLocaleString()}đ</span>
                                  <span className={styles.originalPrice}>{item.price.toLocaleString()}đ</span>
                                </>
                              ) : (
                                <span>{item.price.toLocaleString()}đ</span>
                              )}
                            </div>
                            <button
                              className={`${styles.addBtn} ${inCart ? styles.addBtnAdded : ""}`}
                              onClick={() => addToCart(item)}
                              disabled={!canOrder}
                              title={!canOrder ? "Chỉ bàn đang phục vụ mới gọi được món" : ""}
                            >
                              {inCart ? `✓ Đã thêm (${inCart.quantity})` : "+ Thêm vào"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cột đơn hàng phải */}
              <div className={styles.cartSection}>
                <h3 className={styles.cartTitle}>
                  🛒 Đơn hàng{selectedTable ? ` — Bàn ${selectedTable.number}` : ""}
                </h3>

                {/* Nút thao tác bàn */}
                {selectedTable && (
                  <div className={styles.tableActionsRow}>
                    {isTableEmpty(selectedTable) && (
                      <button
                        className={styles.openTableBtn}
                        onClick={() => handleOpenTable(selectedTable)}
                        disabled={tableActionLoading}
                      >
                        {tableActionLoading ? "Đang mở..." : "🟢 Mở bàn"}
                      </button>
                    )}
                    {isTableServing(selectedTable) && !currentOrder && (
                      <button
                        className={styles.closeTableBtn}
                        onClick={() => handleCloseTable(selectedTable)}
                        disabled={tableActionLoading}
                      >
                        {tableActionLoading ? "Đang xử lý..." : "🔴 Hủy bàn"}
                      </button>
                    )}
                    {isTablePaid(selectedTable) && (
                      <button
                        className={styles.closeTableBtn}
                        onClick={() => handleCloseTable(selectedTable)}
                        disabled={tableActionLoading}
                      >
                        {tableActionLoading ? "Đang xử lý..." : "🧹 Dọn xong (Đổi sang OPEN)"}
                      </button>
                    )}
                  </div>
                )}

                {/* Số khách (chỉ khi chưa có order) */}
                {selectedTable && !currentOrder && (
                  <div className={styles.guestCountRow}>
                    <label className={styles.guestCountLabel}>👥 Số khách:</label>
                    <div className={styles.guestCountControls}>
                      <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))}>−</button>
                      <span>{guestCount}</span>
                      <button onClick={() => setGuestCount(guestCount + 1)}>+</button>
                    </div>
                  </div>
                )}

                {/* Các món ĐÃ gọi (từ backend) */}
                {currentOrder && currentOrder.items && currentOrder.items.length > 0 && (
                  <div className={styles.existingOrder}>
                    <div className={styles.existingOrderTitle}>✅ Đã gọi ({currentOrder.items.length} món)</div>
                    {currentOrder.items.map((item) => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemName}>{item.itemName}</div>
                        <div className={styles.cartItemPrice}>
                          {(item.unitPrice * item.quantity).toLocaleString()}đ
                        </div>
                        <div className={styles.cartItemControls}>
                          <span>× {item.quantity}</span>
                        </div>
                        {item.note && <div className={styles.cartItemNote}>📝 {item.note}</div>}
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "8px", paddingTop: "8px", fontSize: "13px", color: "#d4af37" }}>
                      Tạm tính: {(currentOrder.subtotal ?? 0).toLocaleString()}đ
                    </div>
                  </div>
                )}

                {/* Các món GỌI THÊM (cart local) */}
                {cart.length > 0 && (
                  <div className={styles.newOrder}>
                    <div className={styles.newOrderTitle}>🆕 Gọi thêm ({cart.length} loại)</div>
                    {cart.map((item) => (
                      <div key={item.menuItem.id} className={styles.cartItem}>
                        <div className={styles.cartItemName}>{item.menuItem.name}</div>
                        <div className={styles.cartItemPrice}>
                          {(
                            (item.menuItem.promoPrice ?? item.menuItem.promo_price ?? item.menuItem.price) *
                            item.quantity
                          ).toLocaleString()}đ
                        </div>
                        <div className={styles.cartItemControls}>
                          <button onClick={() => updateQuantity(item.menuItem.id, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.menuItem.id, 1)}>+</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Ghi chú..."
                          value={item.note}
                          onChange={(e) => updateNote(item.menuItem.id, e.target.value)}
                          className={styles.noteInput}
                        />
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "8px", paddingTop: "8px", fontSize: "13px", color: "#d4af37" }}>
                      Thêm: +{totalCartPrice.toLocaleString()}đ
                    </div>
                  </div>
                )}

                {/* Trống */}
                {!currentOrder && cart.length === 0 && (
                  <div className={styles.emptyCart}>
                    {selectedTable && isTableServing(selectedTable)
                      ? "Chưa có món nào. Hãy chọn món từ thực đơn."
                      : "Hãy mở bàn trước để gọi món."}
                  </div>
                )}

                {/* Tổng cộng */}
                {(currentOrder || cart.length > 0) && (
                  <div className={styles.cartTotal}>
                    <span>Tổng cộng:</span>
                    <strong>{((currentOrder?.subtotal ?? 0) + totalCartPrice).toLocaleString()}đ</strong>
                  </div>
                )}

                {/* Error & Success */}
                {orderError && <div className={styles.errorMsg}>❌ {orderError}</div>}
                {orderSuccess && <div className={styles.successMsg}>✅ Gọi món thành công!</div>}

                {/* Nút xác nhận gọi món */}
                {cart.length > 0 && !orderSuccess && selectedTable && isTableServing(selectedTable) && (
                  <button
                    className={styles.confirmBtn}
                    onClick={handleConfirmOrder}
                    disabled={orderLoading}
                  >
                    {orderLoading ? "⏳ Đang gửi..." : "✅ Xác nhận gọi món"}
                  </button>
                )}

                {/* Nút THANH TOÁN - luôn hiện khi bàn SERVING có order */}
                {selectedTable && isTableServing(selectedTable) && currentOrder && (
                  <button
                    className={styles.checkoutBtn}
                    onClick={handleCheckoutClick}
                    disabled={checkoutLoading || orderLoading}
                  >
                    {checkoutLoading ? "⏳ Đang xử lý..." : "💳 Thanh toán & Xuất Hoá Đơn"}
                  </button>
                )}

                {/* Hoá đơn sau thanh toán */}
                {lastInvoice && (
                  <div className={styles.invoiceCard}>
                    <div className={styles.invoiceTitle}>🧾 Hoá Đơn</div>
                    <div className={styles.invoiceRow}>
                      <span>Mã HĐ:</span>
                      <span>#{lastInvoice.id?.slice(0, 12).toUpperCase()}</span>
                    </div>
                    <div className={styles.invoiceRow}>
                      <span>Tổng tiền:</span>
                      <strong>{(lastInvoice.totalAmount ?? 0).toLocaleString()}đ</strong>
                    </div>
                    {lastInvoice.changeAmount != null && lastInvoice.changeAmount > 0 && (
                      <div className={styles.invoiceRow}>
                        <span>Tiền thối:</span>
                        <span>{lastInvoice.changeAmount.toLocaleString()}đ</span>
                      </div>
                    )}
                    <div className={styles.invoiceRow}>
                      <span>Trạng thái:</span>
                      <span style={{ color: "#22c55e" }}>✅ Đã thanh toán</span>
                    </div>
                    <button className={styles.printBtn} onClick={handlePrintInvoice}>
                      🖨️ In hoá đơn
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ TAB: QUẢN LÝ ĐẶT BÀN ════ */}
          {activeTab === "reservations" && (
            <div className={styles.reservationLayout}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>📅 Quản lý Đặt Bàn</h2>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    className={styles.refreshBtn}
                    onClick={() => setShowAllReservations(true)}
                    style={{ background: showAllReservations ? "#d4af37" : "transparent", color: showAllReservations ? "#000" : "#d4af37", border: "1px solid #d4af37" }}
                  >
                    Tất cả
                  </button>
                  <input
                    type="date"
                    className={styles.datePicker}
                    value={reservationsDate}
                    onChange={(e) => {
                      setReservationsDate(e.target.value);
                      setShowAllReservations(false);
                    }}
                  />
                  <button className={styles.refreshBtn} onClick={loadReservations} disabled={reservationsLoading}>
                    🔄 Làm mới
                  </button>
                </div>
              </div>

              {reservationsLoading ? (
                <div className={styles.loading}>Đang tải...</div>
              ) : (
                <>
                  {/* Thống kê */}
                  <div className={styles.reservationSection}>
                    <h3 className={styles.cartTitle}>
                      Thống kê ngày {new Date(reservationsDate + "T00:00:00").toLocaleDateString("vi-VN")}
                    </h3>
                    {calendar ? (
                      <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                          <div className={styles.statValue}>{calendar.totalReservations}</div>
                          <div className={styles.statLabel}>Tổng đơn</div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statValue} style={{ color: "#f59e0b" }}>{calendar.pending}</div>
                          <div className={styles.statLabel}>Chờ duyệt</div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statValue} style={{ color: "#3b82f6" }}>{calendar.confirmed}</div>
                          <div className={styles.statLabel}>Đã duyệt</div>
                        </div>
                        <div className={styles.statCard}>
                          <div className={styles.statValue} style={{ color: "#22c55e" }}>{calendar.arrived}</div>
                          <div className={styles.statLabel}>Đã đến</div>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.emptyCart}>Không có dữ liệu</div>
                    )}
                  </div>

                  {/* Danh sách toàn bộ đặt bàn */}
                  <div className={styles.reservationSection}>
                    <h3 className={styles.cartTitle}>Danh sách đặt bàn</h3>
                    {allReservations.length === 0 ? (
                      <div className={styles.emptyCart}>Không có đơn đặt bàn nào</div>
                    ) : (
                      <div className={styles.reservationList}>
                        {allReservations.map((res) => (
                          <div key={res.id} className={styles.reservationCard}>
                            <div className={styles.resInfo}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h4>{res.customerName} — {res.customerPhone}</h4>
                                <span style={{
                                  padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                                  backgroundColor: res.status === "PENDING" ? "#f59e0b22" : res.status === "CONFIRMED" ? "#3b82f622" : res.status === "ARRIVED" ? "#22c55e22" : "#ef444422",
                                  color: res.status === "PENDING" ? "#f59e0b" : res.status === "CONFIRMED" ? "#3b82f6" : res.status === "ARRIVED" ? "#22c55e" : "#ef4444"
                                }}>
                                  {res.status}
                                </span>
                              </div>
                              <p>🕒 {new Date(res.reservedAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
                              <p>👥 {res.partySize} khách</p>
                              {res.note && <p>📝 {res.note}</p>}
                            </div>
                            <div className={styles.resActions} style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {res.status === "PENDING" && (
                                <>
                                  <button
                                    className={styles.resConfirmBtn}
                                    onClick={() => handleConfirmReservation(res)}
                                  >
                                    ✓ Xác nhận
                                  </button>
                                  <button
                                    className={styles.closeTableBtn}
                                    style={{fontSize: "13px", padding: "8px 12px"}}
                                    onClick={() => handleRejectReservation(res)}
                                  >
                                    ❌ Từ chối
                                  </button>
                                </>
                              )}
                              {res.status === "CONFIRMED" && (
                                <>
                                  <button
                                    className={styles.resConfirmBtn}
                                    style={{background: "#22c55e", fontSize: "13px", padding: "8px 12px"}}
                                    onClick={() => handleArrivedReservation(res)}
                                  >
                                    🚪 Khách đến
                                  </button>
                                  <button
                                    className={styles.closeTableBtn}
                                    style={{background: "#6b7280", fontSize: "13px", padding: "8px 12px"}}
                                    onClick={() => handleNoShowReservation(res)}
                                  >
                                    🚫 Không đến
                                  </button>
                                  <button
                                    className={styles.closeTableBtn}
                                    style={{fontSize: "13px", padding: "8px 12px"}}
                                    onClick={() => handleCancelReservation(res)}
                                  >
                                    🛑 Huỷ
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Thanh toán ────────────────────────────────── */}
      {checkoutModalOpen && checkoutPreview && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setCheckoutModalOpen(false)}
        >
          <div
            style={{
              background: "#1e1e1e", border: "1px solid #333", borderRadius: "12px", padding: "24px",
              maxWidth: "500px", width: "90%", color: "#fff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              maxHeight: "90vh", overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "#d4af37", textAlign: "center" }}>
              Thanh Toán - Bàn {selectedTable?.number}
            </h3>

            {/* Form nhập SĐT */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "8px" }}>
                Số điện thoại khách hàng (nếu có)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Nhập SĐT..."
                  style={{
                    flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #333",
                    background: "#0a0a0a", color: "#fff"
                  }}
                />
                <button
                  onClick={handlePreviewRefresh}
                  style={{
                    padding: "10px 16px", borderRadius: "6px", border: "none",
                    background: "#3b82f6", color: "#fff", cursor: "pointer"
                  }}
                >
                  Kiểm tra
                </button>
              </div>
              {checkoutPreview.customer && (
                <div style={{ marginTop: "8px", fontSize: "14px", color: "#22c55e" }}>
                  Khách hàng: {checkoutPreview.customer.fullName} - Điểm: {checkoutPreview.customer.currentPoints}
                </div>
              )}
            </div>

            {/* Form nhập Voucher */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "8px" }}>
                Mã Voucher
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã voucher..."
                  disabled={appliedVoucher !== null || checkoutLoading}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #333",
                    background: "#0a0a0a", color: "#fff"
                  }}
                />
                {!appliedVoucher ? (
                  <button
                    onClick={handleApplyVoucher}
                    disabled={checkoutLoading}
                    style={{
                      padding: "10px 16px", borderRadius: "6px", border: "none",
                      background: "#eab308", color: "#000", cursor: "pointer", fontWeight: "bold"
                    }}
                  >
                    Áp dụng
                  </button>
                ) : (
                  <button
                    onClick={handleRemoveVoucher}
                    disabled={checkoutLoading}
                    style={{
                      padding: "10px 16px", borderRadius: "6px", border: "none",
                      background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: "bold"
                    }}
                  >
                    Huỷ
                  </button>
                )}
              </div>
              {appliedVoucher && (
                <div style={{ marginTop: "8px", fontSize: "14px", color: "#eab308" }}>
                  Đã áp dụng: {appliedVoucher.code} - {appliedVoucher.description}
                </div>
              )}
            </div>

            {/* Chi tiết tiền */}
            <div style={{ background: "#0a0a0a", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#a1a1aa" }}>Tổng phụ:</span>
                <span>{checkoutPreview.subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#a1a1aa" }}>VAT ({checkoutPreview.vatRate * 100}%):</span>
                <span>{checkoutPreview.vatAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              {checkoutPreview.voucherDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#22c55e" }}>Voucher:</span>
                  <span style={{ color: "#22c55e" }}>-{checkoutPreview.voucherDiscount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {checkoutPreview.pointsDeducted > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#22c55e" }}>Dùng điểm:</span>
                  <span style={{ color: "#22c55e" }}>-{checkoutPreview.pointsDeducted.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid #333", margin: "8px 0", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px", color: "#d4af37" }}>
                <span>Tổng cộng:</span>
                <span>{checkoutPreview.totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            {/* Nhập tiền mặt */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "8px" }}>
                Khách đưa (Tiền mặt)
              </label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                style={{
                  width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333",
                  background: "#0a0a0a", color: "#fff", fontSize: "16px"
                }}
              />
              <div style={{ marginTop: "8px", fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Tiền thừa:</span>
                <span style={{ color: cashReceived >= checkoutPreview.totalAmount ? "#22c55e" : "#ef4444" }}>
                  {(cashReceived - checkoutPreview.totalAmount).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleCheckoutCash}
                disabled={cashReceived < checkoutPreview.totalAmount}
                style={{
                  width: "100%", background: cashReceived >= checkoutPreview.totalAmount ? "#22c55e" : "#3f6212", 
                  color: "#fff", border: "none", borderRadius: "8px", padding: "12px", cursor: cashReceived >= checkoutPreview.totalAmount ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "16px"
                }}
              >
                💵 THANH TOÁN TIỀN MẶT
              </button>
              <button
                onClick={handleCheckoutVnpay}
                style={{
                  width: "100%", background: "#005baa", color: "#fff", border: "none", borderRadius: "8px", 
                  padding: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                }}
              >
                Thanh toán qua VNPAY
              </button>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                style={{
                  width: "100%", background: "transparent", color: "#a1a1aa", border: "1px solid #333", 
                  borderRadius: "8px", padding: "12px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Modal Thông báo hệ thống ────────────────────────────────── */}
      {systemAlert && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setSystemAlert(null)}
        >
          <div
            style={{
              background: "#1e1e1e", border: "1px solid #333", borderRadius: "12px", padding: "24px",
              maxWidth: "400px", width: "90%", color: "#fff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#ef4444" }}>
              {systemAlert.title}
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", lineHeight: "1.5", color: "#a1a1aa" }}>
              {systemAlert.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={{
                  background: "#d4af37", color: "#000", border: "none", borderRadius: "6px",
                  padding: "8px 24px", cursor: "pointer", fontWeight: 600,
                }}
                onClick={() => setSystemAlert(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Xác nhận dọn bàn ──────────────────────────────── */}
      {closeTableConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setCloseTableConfirm(null)}
        >
          <div
            style={{
              background: "#1e1e1e", border: "1px solid #333", borderRadius: "12px", padding: "24px",
              maxWidth: "400px", width: "90%", color: "#fff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#d4af37" }}>
              Xác nhận dọn bàn
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", lineHeight: "1.5", color: "#a1a1aa" }}>
              Xác nhận dọn xong bàn {closeTableConfirm.number}? Bàn sẽ được chuyển sang trạng thái trống.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                style={{
                  background: "transparent", color: "#a1a1aa", border: "1px solid #333", borderRadius: "6px",
                  padding: "8px 24px", cursor: "pointer", fontWeight: 600,
                }}
                onClick={() => setCloseTableConfirm(null)}
              >
                Hủy
              </button>
              <button
                style={{
                  background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px",
                  padding: "8px 24px", cursor: "pointer", fontWeight: 600,
                }}
                onClick={handleCloseTableConfirm}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal hoá đơn HTML ────────────────────────────────── */}
      {invoiceHtml && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setInvoiceHtml(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: "12px", padding: "8px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "8px" }}>
              <button
                style={{ background: "#d4af37", border: "none", borderRadius: "6px", padding: "6px 16px", cursor: "pointer", fontWeight: 700 }}
                onClick={handlePrintInvoice}
              >
                🖨️ In
              </button>
              <button
                style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 16px", cursor: "pointer" }}
                onClick={() => setInvoiceHtml(null)}
              >
                ✕ Đóng
              </button>
            </div>
            <iframe
              srcDoc={invoiceHtml}
              style={{ width: "100%", height: "500px", border: "none" }}
              title="Hoá đơn"
            />
          </div>
        </div>
      )}
    </div>
  );
}
