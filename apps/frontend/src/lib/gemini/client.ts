import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const GEMINI_API_KEY_ENV = "GEMINI_API_KEY";
export const GEMINI_MODEL_ENV = "GEMINI_MODEL";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiApiKey(): string | null {
  const apiKey = process.env[GEMINI_API_KEY_ENV]?.trim();

  return apiKey || null;
}

export function getGeminiModel(): string {
  const model = process.env[GEMINI_MODEL_ENV]?.trim();

  return model || DEFAULT_GEMINI_MODEL;
}

export function createDajeongGeminiClient() {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(`${GEMINI_API_KEY_ENV} is required to create Gemini client.`);
  }

  return createGoogleGenerativeAI({ apiKey });
}
