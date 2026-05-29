"use client";

import type { MenuCategory } from "../types";

type CategoryTabsProps = {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelect: (id: string) => void;
};

export default function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryTabsProps) {
  return (
    <nav className="kiosk-b-category-tabs" aria-label="메뉴 카테고리">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`kiosk-b-category-tab ${
            activeCategoryId === category.id ? "active" : ""
          }`}
          onClick={() => onSelect(category.id)}
        >
          <span className="tab-icon">{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </nav>
  );
}
