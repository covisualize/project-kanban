import type { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  children: ReactNode;
  /** Wider content area for the three-column board. */
  wide?: boolean;
};

/** Site header plus a constrained main column. */
export function AppShell({ children, wide = false }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div
          className={`mx-auto flex w-full items-center px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
        >
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:text-zinc-50"
          >
            project-kanban
          </Link>
        </div>
      </header>
      <main
        className={`mx-auto w-full flex-1 px-4 py-6 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {children}
      </main>
    </div>
  );
}
