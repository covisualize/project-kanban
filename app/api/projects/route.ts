import { NextResponse } from "next/server";
import { handleKanbanError, readJsonObject } from "@/lib/http";
import { getStore } from "@/lib/kanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/projects — list all projects. */
export function GET() {
  try {
    const projects = getStore().listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return handleKanbanError(error);
  }
}

/** POST /api/projects — create a project. */
export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const project = getStore().createProject(body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleKanbanError(error);
  }
}
