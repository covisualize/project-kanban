import { NextResponse } from "next/server";
import { handleKanbanError, readJsonObject } from "@/lib/http";
import { getStore } from "@/lib/kanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ cardId: string }> };

/** GET /api/cards/:cardId — read one card. */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { cardId } = await params;
    const card = getStore().getCard(cardId);
    return NextResponse.json({ card });
  } catch (error) {
    return handleKanbanError(error);
  }
}

/** PATCH /api/cards/:cardId — update card fields. */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { cardId } = await params;
    const body = await readJsonObject(request);
    const card = getStore().updateCard(cardId, body);
    return NextResponse.json({ card });
  } catch (error) {
    return handleKanbanError(error);
  }
}

/** DELETE /api/cards/:cardId — delete one card. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { cardId } = await params;
    getStore().deleteCard(cardId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleKanbanError(error);
  }
}
