import styles from "./overlay.module.css";

function HeroBackground() {
  return (
    <>
      {/* Lớp hình nền */}
      <div className={styles.backgroundImage}></div>
      {/* Lớp phủ tối */}
      <div className={styles.overlay}></div>
    </>
  );
}

export default HeroBackground;
