import { generateText, jsonSchema, stepCountIs, tool } from "ai";

import { createDajeongGeminiClient, getGeminiModel } from "./client";
import { callDajeongMcpTool } from "./mcpClientAdapter";
import {
  createChatResponseFromToolResults,
  type CapturedDajeongToolResult,
} from "./cardBuilders";
import { DAJEONG_GEMINI_SYSTEM_PROMPT } from "./systemPrompt";
import { callDajeongMcpToolDeclaration } from "./tools";
import type { ChatResponse } from "./cardSchema";

const MAX_TOOL_CALL_ROUNDS = 5;
const DEFAULT_SUCCESS_MESSAGE = "요청을 처리했습니다.";
const MISSING_API_KEY_MESSAGE =
  "Gemini API key가 설정되지 않았습니다. GEMINI_API_KEY 환경변수를 확인해 주세요.";
const GENERAL_ERROR_MESSAGE = "AI 주문 처리를 완료하지 못했습니다. 다시 시도해 주세요.";

export type RunDajeongGeminiChatInput = {
  message: string;
  conversationId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createDajeongTools(capturedToolResults: CapturedDajeongToolResult[]) {
  return {
    [callDajeongMcpToolDeclaration.name]: tool({
      description: callDajeongMcpToolDeclaration.description,
      inputSchema: jsonSchema(
        callDajeongMcpToolDeclaration.parameters as unknown as Parameters<
          typeof jsonSchema
        >[0],
      ),
      execute: async (args) => {
        const result = await callDajeongMcpTool(args);

        capturedToolResults.push({
          toolInput: args,
          toolResult: result,
        });

        return result;
      },
    }),
  };
}

function getResponseText(response: unknown): string {
  if (!isRecord(response)) {
    return "";
  }

  const text = response.text;

  return typeof text === "string" ? text.trim() : "";
}

function createErrorChatResponse(
  message: string,
  conversationId?: string,
): ChatResponse {
  return {
    message,
    cards: [
      {
        type: "error",
        title: "처리 실패",
        message,
        recoverable: true,
        actions: [
          {
            type: "retry",
            label: "다시 시도",
          },
        ],
      },
    ],
    requiredUserAction: true,
    ...(conversationId ? { conversationId } : {}),
  };
}

function isMissingApiKeyError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("GEMINI_API_KEY");
}

export async function runDajeongGeminiChat(
  input: RunDajeongGeminiChatInput,
): Promise<ChatResponse> {
  if (typeof input.message !== "string" || input.message.trim() === "") {
    throw new Error("message is required.");
  }

  try {
    const google = createDajeongGeminiClient();
    const modelName = getGeminiModel();
    const capturedToolResults: CapturedDajeongToolResult[] = [];
    const response = await generateText({
      model: google(modelName),
      system: DAJEONG_GEMINI_SYSTEM_PROMPT,
      prompt: input.message.trim(),
      tools: createDajeongTools(capturedToolResults),
      stopWhen: stepCountIs(MAX_TOOL_CALL_ROUNDS),
      temperature: 0,
    });
    const finalText = getResponseText(response) || DEFAULT_SUCCESS_MESSAGE;

    return createChatResponseFromToolResults(
      finalText,
      capturedToolResults,
      input.conversationId,
    );
  } catch (error) {
    if (isMissingApiKeyError(error)) {
      return createErrorChatResponse(MISSING_API_KEY_MESSAGE, input.conversationId);
    }

    console.error("Dajeong Gemini chat failed", error);

    return createErrorChatResponse(GENERAL_ERROR_MESSAGE, input.conversationId);
  }
}
