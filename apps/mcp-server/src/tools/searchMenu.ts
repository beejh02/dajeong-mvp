import { getCompanyMenus } from "../backendClient.js";
import type { MenuItem } from "../types.js";

export type SearchMenuArgs = {
  companyId: string;
  query: string;
};

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export async function searchMenuTool(
  args: SearchMenuArgs,
): Promise<{ menus: MenuItem[] }> {
  const companyId = requireNonEmptyString(args?.companyId, "companyId");
  const query = requireNonEmptyString(args?.query, "query").toLowerCase();
  const response = await getCompanyMenus(companyId);

  return {
    menus: response.menus.filter((menu) => {
      if (!menu.isAvailable) {
        return false;
      }

      return [menu.name, menu.category, menu.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    }),
  };
}
