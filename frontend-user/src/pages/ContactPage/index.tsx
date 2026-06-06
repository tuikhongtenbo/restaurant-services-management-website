import React from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import Header from "../../component/layouts/Header/Header";
import Footer from "../../component/layouts/Footer/footer";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất.");
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <HeroBackground />

        <div className={styles.wrapper}>
          {/* Cột trái: Thông tin liên hệ */}
          <div className={styles.infoCol}>
            <h1 className={styles.title}>Liên Hệ</h1>
            <p className={styles.description}>
              Chúng tôi luôn lắng nghe ý kiến từ bạn. Hãy để lại lời nhắn hoặc
              ghé thăm nhà hàng trực tiếp.
            </p>

            <div className={styles.contactDetails}>
              <div className={styles.infoItem}>
                <strong>Địa chỉ:</strong> 123 Đường Trần Hưng Đạo, Quận 1, TP.
                HCM
              </div>
              <div className={styles.infoItem}>
                <strong>Hotline:</strong> 0123 456 789
              </div>
              <div className={styles.infoItem}>
                <strong>Email:</strong> hello@artiste.vn
              </div>
            </div>

            {/* Nhúng Bản đồ (Iframe) */}
            <div className={styles.mapContainer}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.584745622812!2d106.68962587480479!3d10.766451889381706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f163f5f2aa5%3A0x99565a982fa2c4b0!2zMTIzIFRy4bqnbiBIxrBuZyDEkOG6oW8sIFBoxrDhu51uZyBQaOG6oW0gTmfFqSBMw6NvLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1773153741459!5m2!1sen!2s"
                width="600"
                height="450"
              ></iframe>
            </div>
          </div>

          {/* Cột phải: Form liên hệ (Glassmorphism) */}
          <div className={styles.rightCol}>
            <div className={styles.glassCard}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <Input label="Họ và Tên" placeholder="Nguyễn Văn A" required />

                <Input
                  label="Email"
                  type="email"
                  placeholder="email@vi-du.com"
                  required
                />

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Chủ đề</label>
                  <select className={styles.select}>
                    <option value="feedback">Góp ý dịch vụ</option>
                    <option value="business">Hợp tác kinh doanh</option>
                    <option value="event">Đặt tiệc sự kiện</option>
                    <option value="other">Vấn đề khác</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Lời nhắn</label>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    placeholder="Bạn muốn chia sẻ điều gì với Artiste?"
                    required
                  ></textarea>
                </div>

                <Button type="submit" className={styles.submitBtn}>
                  Gửi Tin Nhắn
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
