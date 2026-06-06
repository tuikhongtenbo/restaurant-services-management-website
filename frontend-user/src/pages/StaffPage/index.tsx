import { useState, useEffect, useCallback } from "react";
import Header from "../../component/layouts/Header/Header";
import { useAuth } from "../../context/AuthContext";
import { tableService, type RestaurantTable } from "../../services/tableService";
import { orderService, type OrderResponse } from "../../services/orderService";
import { invoiceService, type InvoiceResponse } from "../../services/invoiceService";
import { reservationService, type ReservationResponse, type ReservationCalendarResponse } from "../../services/reservationService";
import { useMenu } from "../../hooks/useMenu";
import type { MenuItem } from "../../types/menu";
import { useNavigate } from "react-router-dom";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";

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
  const { isAuthenticated, isStaff } = useAuth();
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
  const [pendingReservations, setPendingReservations] = useState<ReservationResponse[]>([]);
  const [calendar, setCalendar] = useState<ReservationCalendarResponse | null>(null);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationToConfirm, setReservationToConfirm] = useState<ReservationResponse | null>(null);
  const [selectedTableForRes, setSelectedTableForRes] = useState<string>("");

  // ─── State hoá đơn ───────────────────────────────────────────
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<InvoiceResponse | null>(null);
  const [systemAlert, setSystemAlert] = useState<{ title: string; message: string } | null>(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState<boolean>(false);

  // ─── State thao tác bàn ──────────────────────────────────────
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [closeTableConfirm, setCloseTableConfirm] = useState<RestaurantTable | null>(null);

  // ════════════════════════════════════════════════════════════
  // LOAD DATA
  // ════════════════════════════════════════════════════════════
  const loadTables = useCallback(async () => {
    setTablesLoading(true);
    try {
      const [data, ordersData] = await Promise.all([
        tableService.getTables(),
        orderService.getAllOrders()
      ]);

      const updatedTables = data.map(table => {
        if (table.status === "RESERVED") {
          return table;
        }

        const tableOrders = ordersData.filter((o: any) => o.tableId === table.id);
        if (tableOrders.length > 0) {
          tableOrders.sort((a: any, b: any) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
          const latestOrder = tableOrders[0];
          
          if (latestOrder.status === "OPEN") {
            return { ...table, status: "OPEN" };
          }
          if (latestOrder.status === "PAID" && (!table.isActive && table.status !== "OPEN")) {
            return { ...table, status: "PAID" };
          }
        }
        return { ...table, status: "EMPTY" };
      });

      setTables(updatedTables);
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
        reservationService.getReservations(reservationsDate),
        reservationService.getCalendar(reservationsDate),
      ]);
      setPendingReservations(allRes.filter((r) => r.status === "PENDING"));
      setCalendar(cal);
    } catch (err) {
      console.error("loadReservations error:", err);
    } finally {
      setReservationsLoading(false);
    }
  }, [reservationsDate]);

  useEffect(() => {
    if (!isAuthenticated || !isStaff) {
      navigate("/login");
      return;
    }
    loadTables();
    loadReservations();
  }, [isAuthenticated, isStaff, navigate, loadTables, loadReservations]);

  // ════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════
  const isTableServing = (t: RestaurantTable) => t.status === "OPEN";
  const isTableEmpty   = (t: RestaurantTable) => t.status === "EMPTY";
  const isTablePaid    = (t: RestaurantTable) => t.status === "PAID";

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
      const updated = { ...table, status: "OPEN" };
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
  const handleCheckoutClick = () => {
    if (!currentOrder) {
      setSystemAlert({ title: "Thông báo", message: "Không có đơn hàng nào để thanh toán!" });
      return;
    }
    setCheckoutConfirm(true);
  };

  const handleCheckoutConfirm = async () => {
    setCheckoutConfirm(false);
    setCheckoutLoading(true);
    try {
      const invoice = await invoiceService.checkoutCash({
        orderId: currentOrder.id,
        paymentMethod: "CASH",
      });
      setLastInvoice(invoice);

      // Lấy HTML hoá đơn để hiện modal
      try {
        const html = await invoiceService.getInvoiceHtml(invoice.id);
        setInvoiceHtml(html);
      } catch {}

      setSystemAlert({ title: "Thành công", message: "Thanh toán thành công" });

      // Cập nhật lại bàn
      await loadTables();
      setCurrentOrder(null);
      setCart([]);
      if (selectedTable) {
        setSelectedTable({ ...selectedTable, status: "PAID" });
      }
    } catch (err) {
      setSystemAlert({ title: "Lỗi thanh toán", message: (err as Error).message });
    } finally {
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
  const handleConfirmReservation = (res: ReservationResponse) => {
    setReservationToConfirm(res);
    setSelectedTableForRes("");
  };

  const handleConfirmSave = async () => {
    if (!reservationToConfirm || !selectedTableForRes) return;
    const staffId = getStaffIdFromToken();
    if (!staffId) {
      setSystemAlert({ title: "Lỗi", message: "Không lấy được ID nhân viên, vui lòng đăng nhập lại." });
      return;
    }
    setTableActionLoading(true);
    try {
      await reservationService.confirmReservation(reservationToConfirm.id, staffId, selectedTableForRes);
      await loadReservations();
      await loadTables();
      setReservationToConfirm(null);
      setSystemAlert({ title: "Thành công", message: "Đã xác nhận đặt bàn và gán bàn!" });
    } catch (err) {
      setSystemAlert({ title: "Lỗi", message: "Lỗi khi duyệt: " + (err as Error).message });
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
      case "OPEN": return "#f59e0b"; 
      case "PAID": return "#a78bfa"; 
      case "RESERVED": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "EMPTY": return "EMPTY (Trống)";
      case "OPEN": return "OPEN (Đang phục vụ)";
      case "PAID": return "PAID (Đã thanh toán)";
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
                <span style={{ color: "#22c55e" }}>● EMPTY (Trống)</span>
                <span style={{ color: "#f59e0b" }}>● OPEN (Đang phục vụ)</span>
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
                  <input
                    type="date"
                    className={styles.datePicker}
                    value={reservationsDate}
                    onChange={(e) => setReservationsDate(e.target.value)}
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

                  {/* Danh sách chờ duyệt */}
                  <div className={styles.reservationSection}>
                    <h3 className={styles.cartTitle}>Yêu cầu cần duyệt (PENDING)</h3>
                    {pendingReservations.length === 0 ? (
                      <div className={styles.emptyCart}>Không có yêu cầu đang chờ duyệt</div>
                    ) : (
                      <div className={styles.reservationList}>
                        {pendingReservations.map((res) => (
                          <div key={res.id} className={styles.reservationCard}>
                            <div className={styles.resInfo}>
                              <h4>{res.customerName} — {res.customerPhone}</h4>
                              <p>🕒 {new Date(res.reservedAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
                              <p>👥 {res.partySize} khách</p>
                              {res.note && <p>📝 {res.note}</p>}
                            </div>
                            <div className={styles.resActions}>
                              <button
                                className={styles.resConfirmBtn}
                                onClick={() => handleConfirmReservation(res)}
                              >
                                ✓ Xác nhận
                              </button>
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

      {/* ── Modal Xác nhận thanh toán ────────────────────────────────── */}
      {checkoutConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setCheckoutConfirm(false)}
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
              Xác nhận thanh toán
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", lineHeight: "1.5", color: "#a1a1aa" }}>
              Bạn có chắc chắn muốn thanh toán tiền mặt và xuất hoá đơn cho bàn <strong>{selectedTable?.number}</strong> không?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                style={{
                  background: "transparent", color: "#a1a1aa", border: "1px solid #333", borderRadius: "6px",
                  padding: "8px 24px", cursor: "pointer", fontWeight: 600,
                }}
                onClick={() => setCheckoutConfirm(false)}
              >
                Huỷ
              </button>
              <button
                style={{
                  background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px",
                  padding: "8px 24px", cursor: "pointer", fontWeight: 600,
                }}
                onClick={handleCheckoutConfirm}
              >
                Xác nhận & Xuất Hoá Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Chọn Bàn để Xác nhận Đặt bàn ───────────────────── */}
      {reservationToConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setReservationToConfirm(null)}
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
              Xác nhận Đặt Bàn
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#a1a1aa" }}>
              Chọn một bàn trống cho <strong>{reservationToConfirm.partySize}</strong> khách (KH: {reservationToConfirm.customerName}):
            </p>
            <select
              value={selectedTableForRes}
              onChange={(e) => setSelectedTableForRes(e.target.value)}
              style={{
                width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333",
                background: "#2a2a2a", color: "#fff", marginBottom: "24px", outline: "none"
              }}
            >
              <option value="">-- Chọn bàn --</option>
              {tables
                .filter((t) => isTableEmpty(t) && t.capacity >= reservationToConfirm.partySize)
                .sort((a, b) => a.capacity - b.capacity)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    Bàn {t.number} (Sức chứa: {t.capacity})
                  </option>
                ))}
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                style={{
                  background: "transparent", color: "#a1a1aa", border: "1px solid #333", borderRadius: "6px",
                  padding: "8px 24px", cursor: "pointer", fontWeight: 600,
                }}
                onClick={() => setReservationToConfirm(null)}
              >
                Huỷ
              </button>
              <button
                style={{
                  background: selectedTableForRes ? "#22c55e" : "#555",
                  color: "#fff", border: "none", borderRadius: "6px",
                  padding: "8px 24px", cursor: selectedTableForRes ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
                onClick={handleConfirmSave}
                disabled={!selectedTableForRes}
              >
                Lưu & Xác nhận
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
