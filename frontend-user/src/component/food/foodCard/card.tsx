import styles from "./card.module.css";

interface DishCardProps {
  image: string;
  name: string;
  description: string;
  price: string;
  isMustTry?: boolean;
  onOrder?: () => void;
}

const DishCard = ({
  image,
  name,
  description,
  price,
  isMustTry = false,
  onOrder,
}: DishCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={image} alt={name} className={styles.image} />
        {isMustTry && <span className={styles.badge}>Must Try</span>}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.footer}>
          <span className={styles.price}>{price}</span>
          <button className={styles.orderButton} onClick={onOrder}>
            + Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishCard;
