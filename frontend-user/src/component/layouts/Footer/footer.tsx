import styles from "./footer.module.css";

function Footer() {
  return (
    <>
      <section className={styles.container}>
        <section className={styles.leftContent}>
          <img src="images/whitelogo.png" alt="" />
        </section>
        <section className={styles.rightContent}>
          <div className={styles.content}>
            <h3>Thông tin liên hệ</h3>
            <p>
              {" "}
              <i className="fa-solid fa-location-dot"></i> 123 Trần Hưng Đạo,
              Quận 1, Hồ Chí Minh
            </p>
            <p>
              {" "}
              <i className="fa-solid fa-phone"></i> (+84) 123 456 789
            </p>
            <p>
              <i className="fa-solid fa-envelope"></i> hello@artiste.vn
            </p>
          </div>
          <div className={styles.content}>
            <h3>Giờ mở cửa</h3>
            <p>10:30 am - 11:00 pm</p>
          </div>
          <div className={styles.content}>
            <h3>Khám phá</h3>
            <p>Về chúng tôi</p>
            <p>Thực đơn</p>
            <p>Đặt bàn</p>
          </div>
          <div className={styles.content}>
            <h3>Theo dõi chúng tôi</h3>
            <div className={styles.socialIcons}>
              <p>
                <i className="fa-brands fa-facebook"></i>
              </p>
              <p>
                {" "}
                <i className="fa-brands fa-instagram"></i>
              </p>
              <p>
                {" "}
                <i className="fa-brands fa-twitter"></i>
              </p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
export default Footer;
