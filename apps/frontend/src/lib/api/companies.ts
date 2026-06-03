import { getJson } from "./client";
import type { Company, CompanyListResponse } from "./types";

export function getCompanies(): Promise<CompanyListResponse> {
  return getJson<CompanyListResponse>("/companies");
}

export function getCompany(companyId: string): Promise<Company> {
  return getJson<Company>(`/companies/${companyId}`);
}
