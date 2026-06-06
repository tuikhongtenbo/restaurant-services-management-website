import styles from "./about.module.css";

function About() {
  return (
    <fieldset className={styles.hero}>
      <legend>về chúng tôi</legend>

      <section className={styles.leftContent}>
        <h1>Artiste</h1>
        <p className={styles.description}>
          Tại Artiste, chúng tôi tin rằng mỗi món ăn là một bức tâm thư được
          viết bằng hương vị. Giữa nhịp sống hối hả, chúng tôi mở ra một khoảng
          không gian nơi những giá trị thuần Việt được nâng niu và gìn giữ.
          Không chỉ là cơm ngon canh ngọt, mỗi bữa ăn tại đây là cuộc hành trình
          trở về với gian bếp xưa của mẹ, nơi có mùi khói bếp nồng đượm, vị đậm
          đà của mắm truyền thống và độ tươi ngon của thức quà từ đất mẹ Việt
          Nam. Với tất cả lòng hiếu khách và sự tận tâm,Artiste khao khát kể lại
          câu chuyện về tình thân và lòng trân quý nguồn cội qua từng nhịp chạm
          của vị giác. Chào mừng bạn về nhà, để cùng chúng tôi giữ lửa cho những
          giá trị truyền thống trường tồn.
        </p>
      </section>
      <section className={styles.rightContent}></section>
    </fieldset>
  );
}
export default About;
