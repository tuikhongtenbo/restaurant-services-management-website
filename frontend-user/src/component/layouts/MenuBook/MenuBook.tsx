import React, { useState, useMemo, useEffect } from "react";
import { useMenu } from "../../../hooks/useMenu";
import { paginateMenu, type PageContent } from "../../../utils/menuHelper";
import styles from "./MenuBook.module.css";

interface LeafData {
  isCoverFront?: boolean;
  isEmptyFront?: boolean;
  isCoverBack?: boolean;
  front?: PageContent;
  back?: PageContent;
}

export const MenuBook: React.FC = () => {
  const { menu, loading } = useMenu();
  const [activeLeaf, setActiveLeaf] = useState(0);
  const [isInit, setIsInit] = useState(true);

  // Mở khóa animation sau khi load trang để không bị chớp giật
  useEffect(() => {
    const timer = setTimeout(() => setIsInit(false), 50);
    return () => clearTimeout(timer);
  }, []);

  // Tính toán số trang nội dung
  const pages = useMemo(() => paginateMenu(menu, 4), [menu]);

  // THUẬT TOÁN GỘP TRANG THÔNG MINH
  const leafData = useMemo(() => {
    const groups: LeafData[] = [];

    // 1. Luôn có Lá Bìa Trước
    groups.push({ isCoverFront: true });

    // 2. Các Lá Nội Dung (mỗi lá 2 trang)
    for (let i = 0; i < pages.length; i += 2) {
      groups.push({ front: pages[i], back: pages[i + 1] });
    }

    // 3. Xử lý Bìa Sau linh hoạt
    const lastGroup = groups[groups.length - 1];

    // Nếu lá cuối cùng là trang nội dung và chưa có mặt sau (do số trang lẻ)
    if (!lastGroup.isCoverFront && !lastGroup.back) {
      // Ghép luôn Bìa Sau vào mặt sau của lá này
      lastGroup.isCoverBack = true;
    } else {
      // Nếu số trang chẵn (lá cuối đã đầy 2 mặt), tạo thêm 1 lá mới cho Bìa Sau
      groups.push({ isEmptyFront: true, isCoverBack: true });
    }

    return groups;
  }, [pages]);

  const totalLeaves = leafData.length;

  if (loading)
    return <div className={styles.loader}>Đang sắp xếp thực đơn...</div>;

  const getBookStatus = () => {
    if (activeLeaf === 0) return styles.closedFront;
    if (activeLeaf === totalLeaves) return styles.closedBack;
    return styles.opened;
  };

  const renderPageContent = (page: PageContent, pageIndex: number) => (
    <div className={styles.menuContent}>
      {page.isFirstOfCategory && (
        <h2 className={styles.categoryTitle}>
          {/* Hiển thị tên category thật từ API, format đẹp */}
          {page.category.replace(/_/g, " ")}
        </h2>
      )}

      <div className={styles.itemList}>
        {page.items.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemTop}>
              <span className={styles.name}>{item.name}</span>
              <span className={styles.dots} />
              <span className={styles.price}>
                {(item.promoPrice ?? item.promo_price)
                  ? (item.promoPrice ?? item.promo_price)!.toLocaleString() + "đ"
                  : item.price.toLocaleString() + "đ"}
              </span>
            </div>
            <p className={styles.desc}>{item.description}</p>
          </div>
        ))}
      </div>
      <span className={styles.pageNum}>Trang {pageIndex + 1}</span>
    </div>
  );

  return (
    <div className={styles.scene}>
      <div
        className={`${styles.book} ${getBookStatus()} ${isInit ? styles.init : ""}`}
      >
        {leafData.map((leaf, index) => {
          return (
            <div
              key={index}
              className={`${styles.leaf} ${activeLeaf > index ? styles.flipped : ""}`}
              style={{
                zIndex: activeLeaf > index ? 1 : totalLeaves - index,
              }}
              onClick={() =>
                setActiveLeaf(activeLeaf > index ? index : index + 1)
              }
            >
              {/* === XỬ LÝ MẶT TRƯỚC CỦA LÁ === */}
              {leaf.isCoverFront ? (
                <div
                  className={`${styles.page} ${styles.front} ${styles.cover}`}
                >
                  <div className={styles.borderInner}>
                    <h1>ARTISTE</h1>
                    <p>Thực Đơn Truyền Thống</p>
                    <p className={styles.clickToView}>*Click để xem menu*</p>
                  </div>
                </div>
              ) : leaf.isEmptyFront ? (
                <div
                  className={`${styles.page} ${styles.front} ${styles.emptyPage}`}
                ></div>
              ) : (
                <div className={`${styles.page} ${styles.front}`}>
                  {leaf.front && renderPageContent(leaf.front, (index - 1) * 2)}
                </div>
              )}

              {/* === XỬ LÝ MẶT SAU CỦA LÁ === */}
              {leaf.isCoverFront ? (
                <div
                  className={`${styles.page} ${styles.back} ${styles.emptyPage}`}
                >
                  <div className={styles.introText}>Kính mời quý khách...</div>
                </div>
              ) : leaf.isCoverBack ? (
                <div
                  className={`${styles.page} ${styles.back} ${styles.coverBack}`}
                >
                  <div className={styles.footerContent}>
                    <div className={styles.logoMark}>
                      <img
                        src="/images/Brown%20Simple%20Circle%20Restaurant%20Logo.png"
                        alt=""
                      />
                    </div>
                    <h2>Hẹn Gặp Lại</h2>
                    <div className={styles.dividerSmall}></div>
                    <p className={styles.address}>
                      123 Trần Hưng Đạo, Quận 1, Hồ Chí Minh
                    </p>
                    <p className={styles.phone}>Hotline: 0123 456 789</p>
                  </div>
                </div>
              ) : leaf.back ? (
                <div className={`${styles.page} ${styles.back}`}>
                  {renderPageContent(leaf.back, (index - 1) * 2 + 1)}
                </div>
              ) : (
                <div
                  className={`${styles.page} ${styles.back} ${styles.emptyPage}`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
