import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Board } from "@/components/board";
import { getStore, KanbanError } from "@/lib/kanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ projectId: string }> };

export default async function ProjectBoardPage({ params }: RouteParams) {
  const { projectId } = await params;
  const store = getStore();

  let project;
  let cards;
  try {
    project = store.getProject(projectId);
    cards = store.listCards(projectId);
  } catch (error) {
    if (error instanceof KanbanError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <AppShell wide>
      <Board project={project} cards={cards} />
    </AppShell>
  );
}
