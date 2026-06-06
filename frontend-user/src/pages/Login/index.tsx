import { useState } from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import type { ApiError } from "../../types/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Gọi login qua AuthContext để cập nhật state ngay lập tức
      const userType = await login(email, password);
      if (userType && userType !== "CUSTOMER") {
        navigate("/staff");
      } else {
        navigate("/");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <HeroBackground />

      <div className={styles.wrapper}>
        {/* Cột trái: Nội dung giới thiệu */}
        <div className={styles.leftCol}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <img src="/images/whitelogo.png" alt="Logo" />
            </span>
            Artiste
          </div>

          <h1 className={styles.title}>
            Đăng Nhập
            <br />
            Ngay Bây Giờ
          </h1>
          <p className={styles.subtitle}>
            Bạn chưa có tài khoản?{" "}
            <Link to="/register" className={styles.link}>
              Đăng ký ngay
            </Link>
          </p>

          <div className={styles.divider}></div>

          <p className={styles.description}>
            Chào mừng bạn đến với Artiste. Hãy bắt đầu hành trình của bạn tại
            đây.
          </p>

          <Button onClick={() => navigate("/")} className={styles.learnMoreBtn}>
            Trang chủ
          </Button>
        </div>

        {/* Cột phải: Form Đăng nhập */}
        <div className={styles.rightCol}>
          <div className={styles.glassCard}>
            <h2 className={styles.formTitle}>Đăng nhập</h2>

            {error && (
              <div
                style={{
                  color: "#ff4444",
                  marginBottom: "16px",
                  fontSize: "14px",
                  padding: "12px",
                  backgroundColor: "#ffe6e6",
                  borderRadius: "4px",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Email hoặc số điện thoại"
                type="text"
                placeholder={"email@example.com hoặc 09xxxxxxxx"}
                icon={<i className="fa-solid fa-envelope"></i>}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <div className={styles.submitWrapper}>
                <Button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>

                <div className={styles.passwordAction}>
                  <Link to="/changePass">Đổi mật khẩu</Link>
                  <Link to="/forgotPass">Quên mật khẩu</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
