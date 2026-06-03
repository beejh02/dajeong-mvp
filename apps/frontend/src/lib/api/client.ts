const DEFAULT_BACKEND_API_URL = "http://127.0.0.1:8000";

export const BACKEND_API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  responseBody: string;

  constructor(path: string, status: number, responseBody: string) {
    super(`Backend API request failed: ${path} (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new ApiError(path, response.status, await response.text());
  }

  return response.json() as Promise<T>;
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

export function postJson<TResponse, TRequest>(
  path: string,
  body: TRequest,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
