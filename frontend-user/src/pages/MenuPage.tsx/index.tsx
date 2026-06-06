import Footer from "../../component/layouts/Footer/footer";
import Header from "../../component/layouts/Header/Header";
import { MenuBook } from "../../component/layouts/MenuBook/MenuBook";
import HeroBackground from "../../component/layouts/overlay/overlay";
// import Sidebar from "../../component/layouts/Sidebar/Sidebar";
import styles from "./index.module.css";

export default function MenuPage() {
  return (
    <>
      <Header />
      {/* <Sidebar /> */}
      <div className={styles.container}>
        <HeroBackground />
        <MenuBook />
      </div>
      <Footer />
    </>
  );
}
