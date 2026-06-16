import { useState, useEffect } from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import { Link, useNavigate } from "react-router";
import { getPasswordError, passwordsMatch } from "../../utils/validation";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function ChangePassPage() {
  const { isAuthenticated, isCustomer, isLoading } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isCustomer)) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, isCustomer, navigate]);

  const handleNewBlur = () => {
    setNewError(getPasswordError(newPassword));
  };

  const handleConfirmBlur = () => {
    setConfirmError(
      passwordsMatch(newPassword, confirmNew)
        ? null
        : "Mật khẩu xác nhận không trùng",
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nwErr = getPasswordError(newPassword);
    const cfErr = passwordsMatch(newPassword, confirmNew)
      ? null
      : "Mật khẩu xác nhận không trùng";
    setNewError(nwErr);
    setConfirmError(cfErr);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!nwErr && !cfErr) {
      try {
        await authService.changeCustomerPassword({
          currentPassword: oldPassword,
          newPassword: newPassword,
        });
        setSubmitSuccess("Đổi mật khẩu thành công!");
        setOldPassword("");
        setNewPassword("");
        setConfirmNew("");
      } catch (error: any) {
        setSubmitError(
          error.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu"
        );
      }
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
            Đổi
            <br />
            Mật Khẩu
          </h1>
          <p className={styles.subtitle}>
            Bạn đã thay đổi mật khẩu thành công ?{" "}
            <Link to="/login" className={styles.link}>
              Đăng nhập ngay
            </Link>
          </p>

          <div className={styles.divider}></div>

          <p className={styles.description}>
            Chào mừng bạn đến với Artiste.Hãy bắt đầu hành trình của bạn tại
            đây.
          </p>

          <Button link="/" className={styles.learnMoreBtn}>
            Trang chủ
          </Button>
        </div>

        {/* Cột phải: Form Kính mờ (Glassmorphism) */}
        <div className={styles.rightCol}>
          <div className={styles.glassCard}>
            <h2 className={styles.formTitle}>Đăng nhập</h2>{" "}
            {/* Trong ảnh ghi Login, nhưng form giống Sign Up */}
            <form onSubmit={handleSubmit}>
              {submitError && (
                <p className={styles.errorMessage} style={{ marginBottom: 15 }}>{submitError}</p>
              )}
              {submitSuccess && (
                <p style={{ color: "#4caf50", marginBottom: 15, fontSize: "0.875rem" }}>{submitSuccess}</p>
              )}

              <Input
                label="Old Password"
                type="password"
                placeholder="••••••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={handleNewBlur}
                error={!!newError}
              />
              {newError && <p className={styles.errorMessage}>{newError}</p>}

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmNew}
                onChange={(e) => setConfirmNew(e.target.value)}
                onBlur={handleConfirmBlur}
                error={!!confirmError}
              />
              {confirmError && (
                <p className={styles.errorMessage}>{confirmError}</p>
              )}

              <div className={styles.submitWrapper}>
                <Button type="submit" className={styles.submitBtn}>
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
