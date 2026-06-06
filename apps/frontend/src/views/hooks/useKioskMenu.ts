"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adaptMenusToCategories } from "../../lib/adapters/menuAdapter";
import { getCompanyMenus } from "../../lib/api/menus";
import type { KioskMenuCategory } from "../../lib/adapters/menuAdapter";

export function useKioskMenu(companyId: string) {
  const [menuCategories, setMenuCategories] = useState<KioskMenuCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const isMountedRef = useRef(false);

  const loadMenus = useCallback(async () => {
    setIsMenuLoading(true);
    setMenuError(null);

    try {
      const response = await getCompanyMenus(companyId);
      const categories = adaptMenusToCategories(response.menus);

      if (!isMountedRef.current) return;

      setMenuCategories(categories);
      setActiveCategoryId(categories[0]?.id ?? "");
    } catch {
      if (!isMountedRef.current) return;

      setMenuError("메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
      setMenuCategories([]);
      setActiveCategoryId("");
    } finally {
      if (isMountedRef.current) {
        setIsMenuLoading(false);
      }
    }
  }, [companyId]);

  useEffect(() => {
    isMountedRef.current = true;
    const loadTimer = window.setTimeout(() => {
      void loadMenus();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      isMountedRef.current = false;
    };
  }, [loadMenus]);

  return {
    menuCategories,
    activeCategoryId,
    setActiveCategoryId,
    isMenuLoading,
    menuError,
    loadMenus,
  };
}
