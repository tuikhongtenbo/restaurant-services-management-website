import styles from "./contact.module.css";
import { useAppNavigate } from "../../hooks/useAppNavigate";
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

function Contact() {
  const { goTo } = useAppNavigate();
  return (
    <fieldset className={styles.hero}>
      <legend>Thông tin chi tiết</legend>

      <section className={styles.leftContent}></section>
      <section className={styles.rightContent}>
        <h1 className={styles.mainTitle}>Artiste</h1>

        {/* QR Codes Section */}

        {/* Info Section */}
        <div className={styles.infoWrapper}>
          {/* Opening Hours */}
          <div className={styles.infoBlock}>
            <h3 className={styles.subTitle}>Địa chỉ</h3>
            <div className={styles.infoRow}>
              <span className={styles.icon}>
                <i className="fa-solid fa-location-dot"></i>
              </span>
              <p>123 Trần Hưng Đạo, Quận 1, Hồ Chí Minh</p>
            </div>
          </div>

          <div className={styles.infoBlock}>
            <h3 className={styles.subTitle}>Giờ mở cửa</h3>
            <div className={styles.infoRow}>
              <span className={styles.icon}>
                <ClockIcon />
              </span>
              <p>10:30 am - 11:00 pm</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className={styles.infoBlock}>
            <h3 className={styles.subTitle}>Thông tin liên hệ</h3>
            <div className={styles.infoRow}>
              <span className={styles.icon}>
                <PhoneIcon />
              </span>
              <a href="tel:+84911404454">(+84) 123 456 789</a>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.icon}>
                <MailIcon />
              </span>
              <a href="mailto:fb_ha@anantara.com">artiste@gmail.com</a>
            </div>
          </div>

          {/* Button */}
          <button
            className={styles.reservationBtn}
            onClick={() => goTo("/booking")}
          >
            Đặt bàn ngay
          </button>
        </div>
      </section>
    </fieldset>
  );
}

export default Contact;
