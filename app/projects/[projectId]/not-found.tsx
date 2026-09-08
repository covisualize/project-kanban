import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function ProjectNotFound() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Project not found
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        That project does not exist. It may have been deleted.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        Back to projects
      </Link>
    </AppShell>
  );
}
