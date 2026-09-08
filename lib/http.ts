import { NextResponse } from "next/server";
import { KanbanError } from "@/lib/kanban";

/** Map a KanbanError to JSON `{ error }`; rethrow unexpected errors. */
export function handleKanbanError(error: unknown): NextResponse {
  if (error instanceof KanbanError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}

/** Parse a JSON object body or throw KanbanError 400. */
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new KanbanError(400, "Invalid JSON body");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new KanbanError(400, "JSON object body required");
  }
  return body as Record<string, unknown>;
}
