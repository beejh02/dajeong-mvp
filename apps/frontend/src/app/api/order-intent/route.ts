export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof body.text !== "string" ||
    body.text.trim().length === 0
  ) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  return Response.json(
    { error: "Gemini intent extraction is not configured yet" },
    { status: 503 },
  );
}
