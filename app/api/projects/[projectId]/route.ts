import { NextResponse } from "next/server";
import { handleKanbanError, readJsonObject } from "@/lib/http";
import { getStore } from "@/lib/kanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ projectId: string }> };

/** GET /api/projects/:projectId — project plus its cards. */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const store = getStore();
    const project = store.getProject(projectId);
    const cards = store.listCards(projectId);
    return NextResponse.json({ project, cards });
  } catch (error) {
    return handleKanbanError(error);
  }
}

/** PATCH /api/projects/:projectId — update project fields. */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const body = await readJsonObject(request);
    const project = getStore().updateProject(projectId, body);
    return NextResponse.json({ project });
  } catch (error) {
    return handleKanbanError(error);
  }
}

/** DELETE /api/projects/:projectId — delete project and its cards. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    getStore().deleteProject(projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleKanbanError(error);
  }
}
