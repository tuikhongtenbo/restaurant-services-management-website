import type { MenuItem, Category } from "../types/menu";

export interface PageContent {
  category: Category;
  items: MenuItem[];
  isFirstOfCategory: boolean;
}

export const paginateMenu = (
  menu: MenuItem[],
  maxItemsPerPage: number = 5,
): PageContent[] => {
  // Lấy categories theo thứ tự xuất hiện trong menu (không hardcode)
  const seenCategories = new Set<string>();
  const categories: Category[] = [];
  for (const item of menu) {
    if (!seenCategories.has(item.category)) {
      seenCategories.add(item.category);
      categories.push(item.category);
    }
  }

  const allPages: PageContent[] = [];

  categories.forEach((cat) => {
    const catItems = menu.filter((item) => item.category === cat);
    
    let currentPageItems: MenuItem[] = [];
    let currentLines = 0;
    const MAX_LINES_PER_PAGE = 15; // Giới hạn an toàn để không đè lên số trang

    for (let i = 0; i < catItems.length; i++) {
      const item = catItems[i];
      // Ước tính số dòng hiển thị của 1 món: khoảng 24 ký tự sẽ xuống 1 dòng, cộng thêm 1 dòng margin
      const itemLines = Math.ceil(item.name.length / 24) + 1; 

      // Nếu là trang đầu tiên của category, Title sẽ tốn khoảng 3 dòng
      const isFirstOfCategory = allPages.findIndex(p => p.category === cat) === -1;
      const isFirstItemOfPage = currentPageItems.length === 0;
      const titleWeight = (isFirstOfCategory && isFirstItemOfPage) ? 3 : 0;

      // Tính tổng dòng nếu thêm item này vào
      const projectedLines = isFirstItemOfPage 
        ? titleWeight + itemLines 
        : currentLines + itemLines;

      if (
        currentPageItems.length > 0 && 
        (projectedLines > MAX_LINES_PER_PAGE || currentPageItems.length >= maxItemsPerPage)
      ) {
        // Nếu tràn, lưu trang hiện tại và đẩy item này sang trang mới
        allPages.push({
          category: cat,
          items: currentPageItems,
          isFirstOfCategory: allPages.findIndex(p => p.category === cat) === -1,
        });
        currentPageItems = [item];
        currentLines = itemLines; // Trang mới của category này sẽ KHÔNG có title nữa
      } else {
        currentPageItems.push(item);
        currentLines = projectedLines;
      }
    }

    if (currentPageItems.length > 0) {
      allPages.push({
        category: cat,
        items: currentPageItems,
        isFirstOfCategory: allPages.findIndex(p => p.category === cat) === -1,
      });
    }
  });

  return allPages;
};

