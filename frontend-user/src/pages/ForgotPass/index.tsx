import { useEffect, useState } from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import { Link } from "react-router";
import { getEmailError } from "../../utils/validation";
import { useNavigate } from "react-router";

export default function ForgotPassPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isModal, setIsModal] = useState(false);
  const navigate = useNavigate();
  const handleEmailBlur = () => {
    setEmailError(getEmailError(email));
  };
  useEffect(() => {
    if (isModal) {
      const timer = setTimeout(() => {
        setIsModal(false);
        navigate("/");
      }, 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra lỗi
    const emErr = getEmailError(email);

    // 2. Cập nhật state để hiển thị lỗi nếu có
    setEmailError(emErr);

    // 3. Chặn submit nếu có lỗi
    if (emErr) {
      console.log("Email không hợp lệ, không thể gửi yêu cầu.");
      return;
    }
    setIsModal(true);
    // 4. Xử lý logic gọi API gửi email xác nhận ở đây
  };

  return (
    <div className={styles.container}>
      <HeroBackground />

      {isModal && (
        <div className={styles.modal}>Yêu cầu đã được xác nhận ... </div>
      )}
      <div className={styles.wrapper}>
        {/* Cột trái: Nội dung giới thiệu */}
        <div className={styles.leftCol}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <img src="/images/whitelogo.png" alt="Artiste Logo" />
            </span>{" "}
            Artiste
          </div>

          <h1 className={styles.title}>
            Quên
            <br />
            Mật Khẩu
          </h1>
          <p className={styles.subtitle}>
            Bạn đã nhớ ra mật khẩu?{" "}
            <Link to="/login" className={styles.link}>
              Đăng nhập ngay
            </Link>
          </p>

          <div className={styles.divider}></div>

          <p className={styles.description}>
            Đừng lo lắng, hãy nhập email bạn đã đăng ký tài khoản. Chúng tôi sẽ
            gửi cho bạn một đường dẫn để đặt lại mật khẩu mới.
          </p>

          <Button link="/" className={styles.learnMoreBtn}>
            Trang chủ
          </Button>
        </div>

        {/* Cột phải: Form Kính mờ (Glassmorphism) */}
        <div className={styles.rightCol}>
          <div className={styles.glassCard}>
            {/* Đã sửa lại tiêu đề cho đúng */}
            <h2 className={styles.formTitle}>Quên mật khẩu</h2>

            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="ex@gmail.com"
                icon={<i className="fa-solid fa-envelope"></i>}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null); // Tự động xóa lỗi khi người dùng gõ lại
                }}
                onBlur={handleEmailBlur}
                error={!!emailError}
              />
              {/* Hiển thị dòng text báo lỗi nếu có */}
              {emailError && (
                <p className={styles.errorMessage}>{emailError}</p>
              )}

              <div className={styles.submitWrapper}>
                <Button type="submit" className={styles.submitBtn}>
                  Gửi xác nhận
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
