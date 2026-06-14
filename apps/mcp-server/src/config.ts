const DEFAULT_BACKEND_API_URL = "http://localhost:8000";

declare const process: {
  env: {
    BACKEND_API_URL?: string;
  };
};

export const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL
).replace(/\/$/, "");
