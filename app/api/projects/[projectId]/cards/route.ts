import { NextResponse } from "next/server";
import { handleKanbanError, readJsonObject } from "@/lib/http";
import { getStore } from "@/lib/kanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ projectId: string }> };

/** GET /api/projects/:projectId/cards — cards for one project. */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const cards = getStore().listCards(projectId);
    return NextResponse.json({ cards });
  } catch (error) {
    return handleKanbanError(error);
  }
}

/** POST /api/projects/:projectId/cards — create a card on a project. */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const body = await readJsonObject(request);
    const card = getStore().createCard(projectId, body);
    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    return handleKanbanError(error);
  }
}
