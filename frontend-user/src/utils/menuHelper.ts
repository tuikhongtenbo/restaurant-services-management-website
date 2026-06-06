import type { MenuItem, Category } from "../types/menu";

export interface PageContent {
  category: Category;
  items: MenuItem[];
  isFirstOfCategory: boolean;
}

export const paginateMenu = (
  menu: MenuItem[],
  itemsPerPage: number = 4,
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

    for (let i = 0; i < catItems.length; i += itemsPerPage) {
      allPages.push({
        category: cat,
        items: catItems.slice(i, i + itemsPerPage),
        isFirstOfCategory: i === 0,
      });
    }
  });

  return allPages;
};

