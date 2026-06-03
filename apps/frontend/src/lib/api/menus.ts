import { getJson } from "./client";
import type { MenuListResponse } from "./types";

export function getCompanyMenus(companyId: string): Promise<MenuListResponse> {
  return getJson<MenuListResponse>(`/companies/${companyId}/menus`);
}
