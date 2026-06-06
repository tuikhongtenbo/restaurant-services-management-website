import React, { useState } from "react";
import styles from "./menu.module.css";
import { useAppNavigate } from "../../hooks/useAppNavigate";
// 1. Định nghĩa kiểu dữ liệu cho từng item trong thư viện
interface LibraryItem {
  id: number;
  category: string; // Ví dụ: Peace, Sustainability
  title: string; // Ví dụ: BUU STORY
  image: string; // Link ảnh
}

// 2. Dữ liệu giả lập (Bạn thay link ảnh thật vào đây)
const libraryData: LibraryItem[] = [
  {
    id: 1,
    category: "Mỳ quảng gà",
    title:
      "Là linh hồn của ẩm thực miền Trung, món ăn này gây ấn tượng bởi sợi mỳ vàng óng, nước dùng đậm đà sền sệt quyện cùng gà và cái giòn tan vui tai của bánh tráng nướng.",
    image: "images/myquang.jpg",
  },
  {
    id: 2,
    category: "Phở bát đá",
    title:
      'Được mệnh danh là "quốc hồn quốc túy", Phở quyến rũ thực khách bằng làn hương thanh tao từ thảo mộc, những lát thịt bò mềm mại và dòng nước dùng trong veo, ngọt lịm từ xương hầm.',
    image: "images/pho.jpg",
  },
  {
    id: 3,
    category: "Gỏi cuốn",
    title:
      "Món ăn thanh cách này là sự kết hợp tinh tế giữa tôm, thịt, rau sống và bún tươi, tất cả được gói gọn trong lớp bánh tráng mỏng tang, chấm cùng tương đen đậm đà đầy kích thích.",
    image: "images/goicuon.webp",
  },
  {
    id: 4,
    category: "Bánh xèo",
    title:
      "Với lớp vỏ vàng ươm, giòn rụm bao bọc lấy nhân tôm thịt và giá đỗ bên trong, bánh xèo mang đến một trải nghiệm ẩm thực thú vị khi được cuộn cùng rau rừng và chấm nước mắm chua ngọt.",
    image: "images/banhxeo.jpg",
  },
];

const Menu: React.FC = () => {
  // State lưu id của thẻ đang được mở (mặc định mở thẻ số 3 như hình)
  const [activeId, setActiveId] = useState<number>(3);

  // Hàm xử lý khi click vào thẻ
  const handleCardClick = (id: number) => {
    setActiveId(id);
  };

  const { goTo } = useAppNavigate();

  return (
    <div className={styles.container}>
      {/* Cột bên trái: Title & Button */}
      <div className={styles.sidebar}>
        <h2 className={styles.title}>Thực đơn</h2>
        <button className={styles.viewBtn} onClick={() => goTo("/menu")}>
          Xem tất cả
        </button>
      </div>

      {/* Cột bên phải: Slider Gallery */}
      <div className={styles.gallery}>
        {libraryData.map((item) => (
          <div
            key={item.id}
            // Logic class: Nếu id trùng với activeId thì thêm class active
            className={`${styles.card} ${
              activeId === item.id ? styles.active : ""
            }`}
            onClick={() => handleCardClick(item.id)}
          >
            {/* Ảnh nền */}
            <img src={item.image} alt={item.title} className={styles.bgImage} />

            {/* Tag nhỏ ở trên */}
            <div className={styles.topTag}>{item.category}</div>

            {/* Nội dung text khi mở rộng */}
            <div className={styles.content}>
              <div className={styles.bottomTitle}>{item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
