"use client";

import type { MenuCategory } from "../types";

type CategorySidebarProps = {
  categories: MenuCategory[];
  activeCategory: string;
};

export default function CategorySidebar({
  categories,
  activeCategory,
}: CategorySidebarProps) {
  return (
    <nav id="sidebar" aria-label="메뉴 카테고리">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          data-category-id={category.id}
          className={`nav-item ${activeCategory === category.id ? "active" : ""}`}
        >
          <span className="nav-icon">{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </nav>
  );
}
