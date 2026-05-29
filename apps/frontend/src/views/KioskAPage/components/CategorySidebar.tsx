"use client";

import type { MenuCategory } from "../types";

type CategorySidebarProps = {
  categories: MenuCategory[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
};

export default function CategorySidebar({
  categories,
  activeCategory,
  onSelect,
}: CategorySidebarProps) {
  return (
    <nav id="sidebar" aria-label="메뉴 카테고리">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          data-category-id={category.id}
          className={`nav-item ${activeCategory === category.id ? "active" : ""}`}
          onClick={() => onSelect(category.id)}
        >
          <span className="nav-icon">{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </nav>
  );
}
