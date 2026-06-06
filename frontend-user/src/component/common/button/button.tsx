import React from "react";
import styles from "./button.module.css";
import { useNavigate } from "react-router-dom";

// Thêm link vào Props, dấu '?' nghĩa là không bắt buộc (nếu nút chỉ dùng để Submit form)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "outline";
  link?: string;
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  link,

  onClick,
  ...props
}: ButtonProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);

    if (link) {
      navigate(link);
    }
  };

  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${className}`}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
