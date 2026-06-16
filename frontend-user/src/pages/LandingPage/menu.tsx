import React, { useState, useEffect } from "react";
import styles from "./menu.module.css";
import { useAppNavigate } from "../../hooks/useAppNavigate";
import { fetchMenuItems } from "../../services/menuService";
import type { MenuItem } from "../../types/menu";

const Menu: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { goTo } = useAppNavigate();

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchMenuItems();
        // Lấy 5 món đầu tiên
        const top5 = data.slice(0, 5);
        setMenuItems(top5);
        if (top5.length > 0) {
          // Mặc định mở thẻ ở giữa
          const middleIndex = Math.floor(top5.length / 2);
          setActiveId(top5[middleIndex].id);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      }
    };
    loadMenu();
  }, []);

  const handleCardClick = (id: string) => {
    setActiveId(id);
  };

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
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.card} ${
              activeId === item.id ? styles.active : ""
            }`}
            onClick={() => handleCardClick(item.id)}
          >
            {/* Ảnh nền */}
            <img 
              src={item.imageUrl || item.image_url || "/images/placeholder.jpg"} 
              alt={item.name} 
              className={styles.bgImage} 
            />

           

            {/* Nội dung text khi mở rộng */}
            <div className={styles.content}>
              <div className={styles.bottomTitle}>{item.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
