import { useState } from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import { Link, useNavigate } from "react-router";
import {
  getEmailError,
  getPasswordError,
  passwordsMatch,
} from "../../utils/validation";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { setAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handlePasswordBlur = () => {
    setPasswordError(getPasswordError(password));
  };

  const handleEmailBlur = () => {
    setEmailError(getEmailError(email));
  };

  const handleConfirmBlur = () => {
    setConfirmError(
      passwordsMatch(password, confirmPassword)
        ? null
        : "Mật khẩu xác nhận không trùng",
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emErr = getEmailError(email);
    const pwErr = getPasswordError(password);
    const cfErr = passwordsMatch(password, confirmPassword)
      ? null
      : "Mật khẩu xác nhận không trùng";
    const phoneErr = phone.trim() ? null : "Số điện thoại là bắt buộc";

    setEmailError(emErr);
    setPasswordError(pwErr);
    setConfirmError(cfErr);
    setApiError(null);

    if (emErr || pwErr || cfErr || phoneErr) {
      if (phoneErr) setApiError(phoneErr);
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        fullName: name,
        email,
        password,
        phone: phone.trim(),
      });

      // Nếu backend trả về token sau đăng ký, lưu vào localStorage để AuthContext đọc
      if (result?.accessToken) {
        localStorage.setItem("authToken", result.accessToken);
        localStorage.setItem("user", JSON.stringify(result.user));
        // Cập nhật state của AuthContext để Header nhận diện
        setAuth(result.accessToken, result.user);
      }

      // Redirect tới trang chủ (hoặc login nếu chưa có token)
      navigate(result?.accessToken ? "/" : "/login");
    } catch (err) {
      const error = err as { message?: string; status?: number };
      setApiError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <HeroBackground />
      {/* Background Cover */}

      <div className={styles.wrapper}>
        {/* Cột trái: Nội dung giới thiệu */}
        <div className={styles.leftCol}>
          <div className={styles.logo}>
            {/* Bạn có thể thay bằng thẻ img chứa logo thật */}
            <span className={styles.logoIcon}>
              <img src="images/whitelogo.png" alt="" />
            </span>{" "}
            Artiste
          </div>

          <h1 className={styles.title}>
            Tạo
            <br />
            Tài Khoản
          </h1>
          <p className={styles.subtitle}>
            Bạn đã có tài khoản?{" "}
            <Link to="/login" className={styles.link}>
              Đăng nhập
            </Link>
          </p>

          <div className={styles.divider}></div>

          <p className={styles.description}>
            Chào mừng bạn đến với Artiste. Đăng ký tài khoản ngay hôm nay để
            nhận được những ưu đãi độc quyền, lưu lại các món ăn yêu thích và
            cùng chúng tôi sẻ chia tình yêu với nền ẩm thực Việt đầy cảm hứng.
          </p>

          <Button link="/" className={styles.learnMoreBtn}>
            Trang chủ
          </Button>
        </div>

        {/* Cột phải: Form Kính mờ (Glassmorphism) */}
        <div className={styles.rightCol}>
          <div className={styles.glassCard}>
            <h2 className={styles.formTitle}>Đăng ký</h2>
            {apiError && (
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
                {apiError}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <Input
                label="Name"
                type="text"
                placeholder="Nguyễn Văn A"
                icon={<i className="fa-solid fa-circle-user"></i>}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />

              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="09xxxxxxxx (bắt buộc)"
                icon={<i className="fa-solid fa-phone"></i>}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />

              <Input
                label="Email"
                type="email"
                placeholder="hello@reallygreatsite.com"
                icon={<i className="fa-solid fa-envelope"></i>}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                error={!!emailError}
                disabled={loading}
              />
              {emailError && (
                <p className={styles.errorMessage}>{emailError}</p>
              )}

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                error={!!passwordError}
                disabled={loading}
              />
              {passwordError && (
                <p className={styles.errorMessage}>{passwordError}</p>
              )}

              <div className={styles.require}>
                <li>Mật khẩu phải có ít nhất 10 kí tụ</li>
                <li>Mật khẩu phải bao gồm chữ cái, số và kí tự đặc biệt</li>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={handleConfirmBlur}
                error={!!confirmError}
                disabled={loading}
              />
              {confirmError && (
                <p className={styles.errorMessage}>{confirmError}</p>
              )}
              <div className={styles.submitWrapper}>
                <Button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
