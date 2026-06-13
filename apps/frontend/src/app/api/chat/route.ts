import type { ChatResponse } from "../../../lib/gemini/cardSchema";
import { runDajeongGeminiChat } from "../../../lib/gemini/chatRunner";

type ChatRequest = {
  message: string;
  conversationId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatRequest(value: unknown): value is ChatRequest {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    value.message.trim().length > 0
  );
}

function getConversationId(value: unknown) {
  if (!isRecord(value) || typeof value.conversationId !== "string") {
    return undefined;
  }

  return value.conversationId;
}

function createInvalidRequestResponse(): ChatResponse {
  return {
    message: "Invalid chat request.",
    cards: [
      {
        type: "error",
        title: "요청 오류",
        message: "message is required.",
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
  };
}

function createUnexpectedErrorResponse(): ChatResponse {
  return {
    message: "Chat request failed.",
    cards: [
      {
        type: "error",
        title: "처리 실패",
        message: "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
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
  };
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse chat request JSON", error);

      return Response.json(createInvalidRequestResponse(), { status: 400 });
    }

    if (!isChatRequest(body)) {
      return Response.json(createInvalidRequestResponse(), { status: 400 });
    }

    const chatResponse = await runDajeongGeminiChat({
      message: body.message,
      conversationId: getConversationId(body),
    });

    return Response.json(chatResponse, {
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected chat route error", error);

    return Response.json(createUnexpectedErrorResponse(), { status: 500 });
  }
}
