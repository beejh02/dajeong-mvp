import { getCompanies } from "../backendClient.js";
import type { CompanyListResponse } from "../types.js";

export type GetCompaniesArgs = Record<string, never>;

export function getCompaniesTool(
  _args: GetCompaniesArgs,
): Promise<CompanyListResponse> {
  void _args;

  return getCompanies();
}
