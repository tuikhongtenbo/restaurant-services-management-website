import DishCard from "../../component/food/foodCard/card";
import HeroBackground from "../../component/layouts/overlay/overlay"; // Nhớ sửa đường dẫn import cho đúng với project của bạn nhé
import styles from "./hero.module.css";

const dishes = [
  {
    id: 1,
    name: "Phở Bát Đá",
    description: "Thịt Bò, Trứng gà, Gia vị thảo mộc",
    price: "50.000 VND",
    image: "/images/pho.jpg",
    isMustTry: false,
  },
  {
    id: 2,
    name: "Mỳ Quảng Gà",
    description: "Gà Thả Vườn, Bánh Tráng, Rau Sống",
    price: "45.000 VND",
    image: "/images/myquang.jpg", // Đã sửa bỏ chữ "public" cho chuẩn Vite
    isMustTry: true,
  },
];

function Hero() {
  return (
    <section className={styles.hero}>
      {/* Gọi component Background vào đây */}
      <HeroBackground />

      {/* Main Content Container */}
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          <div className={styles.leftContent}>
            <fieldset className={styles.borderBox}>
              <legend className={styles.mainTitle}>Trang chủ</legend>

              <h2 className={styles.subTitle}>
                Artiste - Nơi tìm lại hương vị nguyên bản
              </h2>

              <div className={styles.quoteWrapper}>
                <p className={styles.quoteText}>
                  “Khi ngôn từ lùi lại, để mâm cơm kể chuyện tình thân. ”
                </p>
              </div>

              <div className={styles.description}>
                <p>
                  Tại đây, chúng tôi tin rằng mỗi món ăn là một bức tâm thư viết
                  bằng hương vị. Khi ngôn từ trở nên không đủ để diễn tả lòng
                  hiếu khách, hãy để những món ngon thuần Việt thay chúng tôi kể
                  câu chuyện về tình thân và lòng trân quý. Cảm ơn bạn đã lựa
                  chọn dừng chân để cùng chúng tôi giữ lửa cho những giá trị
                  truyền thống.
                </p>
              </div>
            </fieldset>
          </div>

          <div className={styles.rightContent}>
            <div className={styles.cardGrid}>
              {dishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  name={dish.name}
                  description={dish.description}
                  price={dish.price}
                  image={dish.image}
                  isMustTry={dish.isMustTry}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
