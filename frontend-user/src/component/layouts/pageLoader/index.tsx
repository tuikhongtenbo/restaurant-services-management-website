import styles from "./index.module.css";

export default function PageLoader({ isLoading }: { isLoading: boolean }) {
  if (isLoading == false) return null;
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContent}>
        <img
          src="images/Brown Simple Circle Restaurant Logo.png"
          alt="Đang tải..."
          className={styles.mascot}
        />

        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
    </div>
  );
}
