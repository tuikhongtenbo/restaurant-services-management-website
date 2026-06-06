import { useState } from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import { Link } from "react-router";
import {
  getEmailError,
  getPasswordError,
  passwordsMatch,
} from "../../utils/validation";

export default function ChangePassPage() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);

  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleEmailBlur = () => {
    setEmailError(getEmailError(email));
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emErr = getEmailError(email);
    const nwErr = getPasswordError(newPassword);
    const cfErr = passwordsMatch(newPassword, confirmNew)
      ? null
      : "Mật khẩu xác nhận không trùng";
    setEmailError(emErr);
    setNewError(nwErr);
    setConfirmError(cfErr);
    if (!emErr && !nwErr && !cfErr) {
      console.log("change pass submit", { email });
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
              <Input
                label="Email"
                type="email"
                placeholder="ex@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                error={!!emailError}
              />
              {emailError && (
                <p className={styles.errorMessage}>{emailError}</p>
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
