// 이 파일은 Gemini function calling의 local tool handler를 제공한다.
// 이번 단계에서는 조회성 low-risk tool만 구현한다.
// 주문 생성은 confirm_order handler에서만 다루며, 이 파일의 현재 구현에는 포함하지 않는다.

import { BACKEND_API_URL } from "../api/client";
import type { CompanyListResponse, MenuItem, MenuListResponse } from "../api/types";

export type GetCompaniesArgs = Record<string, never>;

export type GetCompanyMenusArgs = {
  companyId: string;
};

export type SearchMenuArgs = {
  companyId: string;
  query: string;
};

async function requestBackendJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_API_URL}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Backend API request failed: ${path} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function handleGetCompanies(
  _args: GetCompaniesArgs,
): Promise<CompanyListResponse> {
  void _args;

  return requestBackendJson<CompanyListResponse>("/companies");
}

export async function handleGetCompanyMenus(
  args: GetCompanyMenusArgs,
): Promise<MenuListResponse> {
  if (typeof args?.companyId !== "string" || args.companyId.trim() === "") {
    throw new Error("companyId is required.");
  }

  const companyId = args.companyId.trim();

  return requestBackendJson<MenuListResponse>(
    `/companies/${encodeURIComponent(companyId)}/menus`,
  );
}

export async function handleSearchMenu(
  args: SearchMenuArgs,
): Promise<{ menus: MenuItem[] }> {
  if (typeof args?.companyId !== "string" || args.companyId.trim() === "") {
    throw new Error("companyId is required.");
  }

  if (typeof args?.query !== "string" || args.query.trim() === "") {
    throw new Error("query is required.");
  }

  const companyId = args.companyId.trim();
  const query = args.query.trim().toLowerCase();
  const response = await requestBackendJson<MenuListResponse>(
    `/companies/${encodeURIComponent(companyId)}/menus`,
  );

  const filteredMenus = response.menus.filter((menu) => {
    if (!menu.isAvailable) {
      return false;
    }

    const searchableText = [menu.name, menu.category, menu.description]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  return { menus: filteredMenus };
}
