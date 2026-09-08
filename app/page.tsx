import { AppShell } from "@/components/app-shell";
import { ProjectList } from "@/components/project-list";
import { getStore } from "@/lib/kanban";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function Home() {
  const projects = getStore().listProjects();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Projects
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Open a project to see columns and cards. Drag cards between columns or
        use the Status select.
      </p>
      <ProjectList projects={projects} />
    </AppShell>
  );
}
