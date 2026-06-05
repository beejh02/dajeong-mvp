import type {
  MenuItem as BackendMenuItem,
  MenuOptionChoice,
  MenuOptionGroup,
} from "../api/types";

export type KioskMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  img: string;
  optionGroups: MenuOptionGroup[];
  /**
   * Temporary legacy field for the current kiosk option dialog.
   * TODO: Remove after KioskOptionDialog is migrated to optionGroups.
   */
  options: MenuOptionChoice[];
  badge?: string;
};

export type KioskMenuCategory = {
  id: string;
  title: string;
  icon: string;
  label: string;
  items: KioskMenuItem[];
};

const CATEGORY_META: Record<string, { title: string; icon: string; label: string }> = {
  burger: { title: "버거 메뉴", icon: "🍔", label: "버거" },
  side: { title: "사이드 메뉴", icon: "🍟", label: "사이드" },
  drink: { title: "음료 메뉴", icon: "🥤", label: "음료" },
  dessert: { title: "디저트 메뉴", icon: "🍦", label: "디저트" },
  wrap: { title: "랩 메뉴", icon: "🌯", label: "랩" },
  salad: { title: "샐러드 메뉴", icon: "🥗", label: "샐러드" },
};

function normalizeCategoryId(category: string) {
  return `category-${category.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-")}`;
}

function getCategoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      title: `${category} 메뉴`,
      icon: "🍽️",
      label: category,
    }
  );
}

export function adaptMenusToCategories(
  menus: BackendMenuItem[],
): KioskMenuCategory[] {
  const categories = new Map<string, KioskMenuCategory>();

  for (const menu of menus) {
    if (!menu.isAvailable) continue;

    const meta = getCategoryMeta(menu.category);
    const categoryId = normalizeCategoryId(menu.category);
    const category =
      categories.get(categoryId) ??
      {
        id: categoryId,
        title: meta.title,
        icon: meta.icon,
        label: meta.label,
        items: [],
      };

    category.items.push({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      price: menu.price,
      img: menu.imageUrl,
      optionGroups: menu.optionGroups,
      options: menu.optionGroups.flatMap((group) => group.choices),
      ...(menu.badge ? { badge: menu.badge } : {}),
    });

    categories.set(categoryId, category);
  }

  return Array.from(categories.values());
}
