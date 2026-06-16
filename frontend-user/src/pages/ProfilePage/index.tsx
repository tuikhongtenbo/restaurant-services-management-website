import styles from "./index.module.css";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import HeroBackground from "../../component/layouts/overlay/overlay";
import Header from "../../component/layouts/Header/Header";

export default function ProfilePage() {
  const { user, token, userType, logout, isLoading, setAuth, isCustomer } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);

  const startEditing = () => {
    setEditFullName(user?.fullName || "");
    setEditPhone(user?.phone || "");
    setIsEditing(true);
    setUpdateError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editFullName.trim() || !editPhone.trim()) {
      setUpdateError("Họ tên và số điện thoại không được để trống.");
      return;
    }
    try {
      setUpdateError(null);
      const updatedUser = await authService.updateCustomerInfo({
        fullName: editFullName,
        phone: editPhone,
        email: user?.email || "",
      });
      if (token) {
        setAuth(token, updatedUser);
      }
      setIsEditing(false);
    } catch (error: any) {
      setUpdateError(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDisplayRole = () => {
    if (userType === "CUSTOMER") return "Khách hàng";

    if (user?.roles && user.roles.length > 0) {
      const roleMap: Record<string, string> = {
        "STAFF": "Nhân viên",
        "ADMIN": "Quản trị viên",
        "MANAGER": "Quản lý",
        "KITCHEN_STAFF": "Nhân viên bếp",
        "CASHIER": "Thu ngân",
        "WAITER": "Phục vụ",
        "CUSTOMER": "Khách hàng"
      };
      
      const rolesToDisplay = user.roles.map(r => {
        const cleanRole = r.toUpperCase().replace("ROLE_", "");
        return roleMap[cleanRole] || cleanRole;
      });
      return rolesToDisplay.join(", ");
    }

    if (isStaff) return "Nhân viên";
    return "Khách hàng";
  };

  const getAvatarChar = () => {
    if (!user) return "U";
    return user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <HeroBackground />
        <Header />
        <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
          Đang tải thông tin...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <HeroBackground />
        <Header />
        <div className={styles.notLoggedIn}>
          <p>Bạn chưa đăng nhập.</p>
          <button onClick={() => navigate("/login")}>Đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <HeroBackground />
      <Header />

      <div className={styles.pageContent}>
        <div className={styles.card}>
          {/* Header card */}
          <div className={styles.cardHeader}>
            <div className={styles.avatarLarge}>{getAvatarChar()}</div>
            <div className={styles.cardHeaderInfo}>
              <h1 className={styles.displayName}>{user.fullName || "Người dùng"}</h1>
              <span className={styles.roleBadge}>{getDisplayRole()}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Thông tin chi tiết */}
          <div className={styles.infoSection}>
            <h2 className={styles.sectionTitle}>Thông tin tài khoản</h2>

            <div className={styles.infoGrid}>
              {updateError && (
                <div style={{ color: "var(--color-primary-orange)", marginBottom: "15px", gridColumn: "1 / -1" }}>
                  {updateError}
                </div>
              )}

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>👤 Họ và tên</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", color: "black" }}
                  />
                ) : (
                  <span className={styles.infoValue}>{user.fullName || "—"}</span>
                )}
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>📧 Email</span>
                <span className={styles.infoValue}>{user.email || "—"}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>📞 Số điện thoại</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", color: "black" }}
                  />
                ) : (
                  <span className={styles.infoValue}>{user.phone || "—"}</span>
                )}
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>🔑 Vai trò</span>
                <span className={styles.infoValue}>{getDisplayRole()}</span>
              </div>

              {user.tier && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>⭐ Hạng thành viên</span>
                  <span className={styles.infoValue}>{user.tier}</span>
                </div>
              )}

              {user.currentPoints !== undefined && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>🎯 Điểm tích lũy</span>
                  <span className={styles.infoValue}>{user.currentPoints.toLocaleString()} điểm</span>
                </div>
              )}

              {user.totalSpent !== undefined && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>💰 Tổng chi tiêu</span>
                  <span className={styles.infoValue}>{user.totalSpent.toLocaleString()}đ</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.actions}>
            {isEditing ? (
              <>
                <button className={styles.actionBtn} onClick={handleSave} style={{ backgroundColor: "var(--color-primary-green)", color: "white" }}>
                  💾 Lưu thay đổi
                </button>
                <button className={styles.actionBtn} onClick={cancelEditing}>
                  ❌ Hủy
                </button>
              </>
            ) : (
              <>
                {isCustomer && (
                  <button className={styles.actionBtn} onClick={startEditing}>
                    ✏️ Sửa thông tin
                  </button>
                )}
                {isCustomer && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate("/changePass")}
                  >
                    🔒 Đổi mật khẩu
                  </button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.logoutBtn}`}
                  onClick={handleLogout}
                >
                  🚪 Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
