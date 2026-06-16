import styles from "./Header.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isStaff, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo bên trái */}
        <nav className={styles.navGroup}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoPlaceholder}>
              <div className={styles.logoInner}>
                <img
                  src="images/Brown Simple Circle Restaurant Logo.png"
                  alt="logo"
                  className={styles.logoImage}
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Menu links giữa */}
        <nav className={styles.navGroup}>
          <Link to="/" className={styles.navItem}>Trang chủ</Link>
          <Link to="/menu" className={styles.navItem}>Thực đơn</Link>
          <Link to="/contact" className={styles.navItem}>Liên hệ</Link>
          <Link to="/booking" className={styles.navItem}>Đặt bàn</Link>

          {/* Đặt bàn: chỉ staff mới thấy */}
          {isStaff && (
            <Link to="/staff" className={styles.navItem}>
              🍽️ Quản lý
            </Link>
          )}
        </nav>

        <div className={styles.line}></div>

        {/* Phần auth bên phải */}
        <div className={styles.btn}>
          {isAuthenticated && user ? (
            /* Khi đã đăng nhập: hiện avatar + dropdown */
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.userBtn}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className={styles.avatar}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <span className={styles.userName}>
                  {user.fullName || user.email}
                </span>
                {isStaff && <span className={styles.staffBadge}>STAFF</span>}
                <span className={styles.chevron}>{dropdownOpen ? "▲" : "▼"}</span>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.fullName}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                    {isStaff && (
                      <span className={styles.dropdownRole}>🔑 Nhân viên</span>
                    )}
                  </div>
                  <div className={styles.dropdownDivider} />
                  {isStaff && (
                    <button
                      className={styles.dropdownItem}
                      onClick={() => { setDropdownOpen(false); navigate("/staff"); }}
                    >
                      🍽️ Quản lý bàn & gọi món
                    </button>
                  )}
                  <button
                    className={styles.dropdownItem}
                    onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                  >
                    👤 Thông tin tài khoản
                  </button>
                  {!isStaff && (
                    <button
                      className={styles.dropdownItem}
                      onClick={() => { setDropdownOpen(false); navigate("/changePass"); }}
                    >
                      🔒 Đổi mật khẩu
                    </button>
                  )}
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    onClick={handleLogout}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Khi chưa đăng nhập: hiện nút login/register */
            <>
              <button className={styles.loginBtn} onClick={() => navigate("/login")}>
                Đăng nhập
              </button>
              <button className={styles.registerBtn} onClick={() => navigate("/register")}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
      <div className={styles.bottomLine}></div>
    </header>
  );
}

export default Header;
