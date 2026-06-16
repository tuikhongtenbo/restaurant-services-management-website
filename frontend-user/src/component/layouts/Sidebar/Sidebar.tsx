// Sidebar.tsx
import React, { useState } from "react";
import styles from "./Sidebar.module.css";

// Khai báo kiểu dữ liệu
interface SidebarProps {
  onMenuSelect?: (category: string) => void;
}

const menuCategories = [
  "Tất cả",
  "Món ăn nước",
  "Món ăn khô",
  "Nước uống",
  "Các set món ăn",
];

const Sidebar: React.FC<SidebarProps> = ({ onMenuSelect }) => {
  const [activeItem, setActiveItem] = useState<string>("Tất cả");

  const handleItemClick = (category: string) => {
    setActiveItem(category);
    if (onMenuSelect) {
      onMenuSelect(category);
    }
  };

  return (
    <nav className={styles.horizontalMenu}>
      <div className={styles.menuContainer}>
        {/* Danh sách menu ngang */}
        <ul className={styles.menuList}>
          {menuCategories.map((category) => (
            <li
              key={category}
              className={`${styles.menuItem} ${activeItem === category ? styles.active : ""}`}
              onClick={() => handleItemClick(category)}
            >
              {category}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
