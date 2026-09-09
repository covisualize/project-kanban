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
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-zinc-50 to-zinc-100 font-sans dark:from-zinc-950 dark:to-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div
          className={`mx-auto flex w-full items-center gap-3 px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
        >
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            aria-label="project-kanban home"
          >
            <span aria-hidden="true" className="flex items-end gap-0.5">
              <span className="w-1.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" style={{ height: 18 }} />
              <span className="w-1.5 rounded-sm bg-blue-500" style={{ height: 12 }} />
              <span className="w-1.5 rounded-sm bg-emerald-500" style={{ height: 16 }} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-950 hover:underline dark:text-zinc-50">
              project-kanban
            </span>
          </Link>
          <span className="ml-auto hidden text-xs text-zinc-400 sm:inline dark:text-zinc-500">
            Local board · SQLite · No sign-in
          </span>
        </div>
      </header>
      <main
        className={`mx-auto w-full flex-1 px-4 py-6 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {children}
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6">
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
          Drag cards or use the Status select — both save to the same API.
        </p>
      </footer>
    </div>
  );
}
