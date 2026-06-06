import React, { useState } from "react";
import { Button } from "../../component/common/button/button";
import { Input } from "../../component/common/input/input";
import HeroBackground from "../../component/layouts/overlay/overlay";
import styles from "./index.module.css";
import Header from "../../component/layouts/Header/Header";
import Footer from "../../component/layouts/Footer/footer";
import { reservationService } from "../../services/reservationService";
import type { ApiError } from "../../types/auth";

export default function BookingPage() {
  const [activeTab, setActiveTab] = useState<"booking" | "check">("booking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    reservationDate: "",
    reservationTime: "",
    partySize: 2,
    note: "",
  });

  // Check Availability State
  const [checkParams, setCheckParams] = useState({
    partySize: 2,
    date: "",
  });
  const [checkResult, setCheckResult] = useState<{ type: "dates" | "times"; data: string[] } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "partySize" ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleCheckInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setCheckParams((prev) => ({
      ...prev,
      [name]: name === "partySize" ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCheckResult(null);

    try {
      if (checkParams.date) {
        // Tra cứu giờ trống của ngày đó
        const times = await reservationService.getAvailableTimes(checkParams.date, checkParams.partySize);
        setCheckResult({ type: "times", data: times });
      } else {
        // Tra cứu các ngày trống
        const dates = await reservationService.getAvailableDates(checkParams.partySize);
        setCheckResult({ type: "dates", data: dates });
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tra cứu.");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const reservedAtDate = new Date(`${formData.reservationDate}T${formData.reservationTime}`);

      await reservationService.createReservation({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        partySize: formData.partySize,
        reservedAt: reservedAtDate.toISOString(),
        note: formData.note,
      });

      setSuccess(true);
      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        reservationDate: "",
        reservationTime: "",
        partySize: 2,
        note: "",
      });
      // Show success message for 3 seconds then hide
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Đặt bàn thất bại. Vui lòng thử lại.");
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <HeroBackground />

        <div className={styles.wrapper}>
          <div className={styles.content}>
            <h1 className={styles.title}>Đặt Bàn</h1>
            <p className={styles.subtitle}>
              Trải nghiệm không gian ẩm thực tinh tế tại <span>Artiste</span>
            </p>

            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "booking" ? styles.activeTab : ""}`}
                onClick={() => {
                  setActiveTab("booking");
                  setError(null);
                  setSuccess(false);
                }}
              >
                Đặt Bàn
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "check" ? styles.activeTab : ""}`}
                onClick={() => {
                  setActiveTab("check");
                  setError(null);
                  setSuccess(false);
                }}
              >
                Tra cứu bàn trống
              </button>
            </div>

            <div className={styles.glassCard}>
              {success && activeTab === "booking" && (
                <div
                  style={{
                    color: "#228B22",
                    marginBottom: "16px",
                    fontSize: "14px",
                    padding: "12px",
                    backgroundColor: "#e8f5e9",
                    borderRadius: "4px",
                  }}
                >
                  ✓ Đặt bàn thành công! Chúng tôi sẽ gọi xác nhận trong ít phút.
                </div>
              )}

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

              {activeTab === "booking" ? (
                /* FORM ĐẶT BÀN */
                <form onSubmit={handleBooking} className={styles.bookingForm}>
                  {/* Row 1: Thông tin cá nhân */}
                  <div className={styles.row}>
                    <Input
                      label="Họ và Tên"
                      placeholder="Nguyễn Văn A"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    <Input
                      label="Số điện thoại"
                      type="tel"
                      placeholder="0901 234 567"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Row 2: Thời gian và số lượng */}
                  <div className={styles.row}>
                    <Input
                      label="Ngày đặt"
                      type="date"
                      name="reservationDate"
                      value={formData.reservationDate}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Giờ đến</label>
                      <select
                        className={styles.select}
                        name="reservationTime"
                        value={formData.reservationTime}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Chọn giờ</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Số khách */}
                  <div className={styles.row}>
                    <div className={styles.inputGroup} style={{ width: "100%" }}>
                      <label className={styles.label}>Số lượng khách</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className={styles.numberInput}
                        name="partySize"
                        value={formData.partySize}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Lời nhắn/Dị ứng */}
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Ghi chú (Yêu cầu đặc biệt)</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Ví dụ: Trang trí sinh nhật, dị ứng hải sản..."
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows={3}
                      disabled={loading}
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận đặt bàn"}
                  </Button>
                </form>
              ) : (
                /* FORM TRA CỨU BÀN TRỐNG */
                <form onSubmit={handleCheckAvailability} className={styles.bookingForm}>
                  <div className={styles.row}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Số lượng khách</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className={styles.numberInput}
                        name="partySize"
                        value={checkParams.partySize}
                        onChange={handleCheckInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Ngày xem giờ trống (Tùy chọn)</label>
                      <input
                        type="date"
                        className={styles.numberInput}
                        name="date"
                        value={checkParams.date}
                        onChange={handleCheckInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                  >
                    {loading ? "Đang tra cứu..." : "Tra cứu"}
                  </Button>

                  {/* Hiển thị kết quả tra cứu */}
                  {checkResult && (
                    <div className={styles.resultArea}>
                      <h3 className={styles.resultTitle}>
                        {checkResult.type === "dates"
                          ? `Các ngày còn bàn cho ${checkParams.partySize} khách:`
                          : `Các giờ còn trống ngày ${checkParams.date} cho ${checkParams.partySize} khách:`}
                      </h3>
                      {checkResult.data.length > 0 ? (
                        <div className={styles.resultList}>
                          {checkResult.data.map((item, index) => (
                            <div key={index} className={styles.resultItem}>
                              {checkResult.type === "times" ? item.substring(0, 5) : item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>
                          Rất tiếc, không tìm thấy kết quả phù hợp.
                        </p>
                      )}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
