import styles from "./index.module.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import HeroBackground from "../../component/layouts/overlay/overlay";
import Header from "../../component/layouts/Header/Header";

export default function ProfilePage() {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDisplayRole = () => {
    switch (userType) {
      case "CUSTOMER": return "Khách hàng";
      case "STAFF": return "Nhân viên";
      case "ADMIN": return "Quản trị viên";
      case "MANAGER": return "Quản lý";
      case "KITCHEN_STAFF": return "Nhân viên bếp";
      case "CASHIER": return "Thu ngân";
      case "WAITER": return "Phục vụ";
      default: return "Khách hàng";
    }
  };

  const getAvatarChar = () => {
    if (!user) return "U";
    return user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";
  };

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
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>👤 Họ và tên</span>
                <span className={styles.infoValue}>{user.fullName || "—"}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>📧 Email</span>
                <span className={styles.infoValue}>{user.email || "—"}</span>
              </div>

              {user.phone && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>📞 Số điện thoại</span>
                  <span className={styles.infoValue}>{user.phone}</span>
                </div>
              )}

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

          {/* Hành động */}
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => navigate("/changePass")}
            >
              🔒 Đổi mật khẩu
            </button>
            <button
              className={`${styles.actionBtn} ${styles.logoutBtn}`}
              onClick={handleLogout}
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
