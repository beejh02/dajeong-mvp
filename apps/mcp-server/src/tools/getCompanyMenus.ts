import { getCompanyMenus } from "../backendClient.js";
import type { MenuListResponse } from "../types.js";

export type GetCompanyMenusArgs = {
  companyId: string;
};

function requireCompanyId(args: GetCompanyMenusArgs): string {
  if (typeof args?.companyId !== "string" || args.companyId.trim() === "") {
    throw new Error("companyId is required.");
  }

  return args.companyId.trim();
}

export function getCompanyMenusTool(
  args: GetCompanyMenusArgs,
): Promise<MenuListResponse> {
  return getCompanyMenus(requireCompanyId(args));
}
