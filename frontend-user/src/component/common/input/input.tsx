import React from "react";
import styles from "./input.module.css";

interface InputProps extends React.InputHTMLAttributes<
  HTMLInputElement | HTMLSelectElement
> {
  label: string;
  isSelect?: boolean;
  options?: string[]; // Dùng nếu là thẻ select
  icon?: React.ReactNode;
  className?: string;
  error?: boolean;
}

export const Input = ({
  label,
  isSelect = false,
  options = [],
  className = "",
  icon,
  error = false,
  type,
  ...props
}: InputProps) => {
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : (type as any);
  const inputClasses = `${styles.inputField} ${error ? styles.errorBorder : ""}`;

  const handleToggle = () => setShow((s) => !s);

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      <label className={styles.label}>{label}</label>

      <div className={styles.inputWrapper}>
        {isSelect ? (
          <select
            className={inputClasses}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            <option value="" disabled hidden>
              {props.placeholder}
            </option>
            {options.map((opt, index) => (
              <option key={index} value={opt} className={styles.option}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={inputClasses}
            type={inputType}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {isPassword ? (
          <div
            className={styles.iconContainer}
            onClick={handleToggle}
            role="button"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <i className="fa-solid fa-eye"></i>
            ) : (
              <i className="fa-solid fa-eye-slash"></i>
            )}
          </div>
        ) : (
          icon && <div className={styles.iconContainer}>{icon}</div>
        )}
      </div>
    </div>
  );
};
