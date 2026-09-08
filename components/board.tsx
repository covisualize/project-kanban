"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CardFormDialog } from "@/components/card-form-dialog";
import { CardItem } from "@/components/card-item";
import { deleteProject, updateProject } from "@/lib/api-client";
import { groupCardsByStatus } from "@/lib/group-cards";
import type { Card, CardStatus, Project } from "@/lib/types";
import { CARD_STATUS_LABELS, CARD_STATUSES } from "@/lib/types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  errorClass,
  fieldClass,
  labelClass,
} from "@/lib/ui";

type BoardProps = {
  project: Project;
  cards: Card[];
};

/** Project board: columns from card status, mutations via CRUD APIs. */
export function Board({ project, cards }: BoardProps) {
  const router = useRouter();
  const grouped = groupCardsByStatus(cards);
  const [dialog, setDialog] = useState<"create" | Card | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await updateProject(project.id, name);
      setRenaming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename project");
    } finally {
      setPending(false);
    }
  }

  async function onDeleteProject() {
    const ok = window.confirm(
      `Delete project “${project.name}” and all of its cards?`,
    );
    if (!ok) return;
    setError(null);
    setPending(true);
    try {
      await deleteProject(project.id);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project");
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            ← All projects
          </Link>
          {renaming ? (
            <form onSubmit={onRename} className="mt-3 max-w-md space-y-2">
              <label className={labelClass} htmlFor="board-project-name">
                Project name
              </label>
              <input
                id="board-project-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
                disabled={pending}
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={btnPrimary} disabled={pending}>
                  Save
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={pending}
                  onClick={() => {
                    setRenaming(false);
                    setName(project.name);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {project.name}
            </h1>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setDialog("create")}
            disabled={pending}
          >
            New card
          </button>
          {!renaming ? (
            <button
              type="button"
              className={btnSecondary}
              disabled={pending}
              onClick={() => {
                setName(project.name);
                setRenaming(true);
              }}
            >
              Rename project
            </button>
          ) : null}
          <button
            type="button"
            className={btnDanger}
            disabled={pending}
            onClick={onDeleteProject}
          >
            Delete project
          </button>
        </div>
      </div>

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {CARD_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            cards={grouped[status]}
            pending={pending}
            onEdit={(item) => setDialog(item)}
            onError={setError}
            onPending={setPending}
          />
        ))}
      </div>

      {dialog !== null ? (
        <CardFormDialog
          projectId={project.id}
          card={dialog === "create" ? null : dialog}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

type BoardColumnProps = {
  status: CardStatus;
  cards: Card[];
  pending: boolean;
  onEdit: (card: Card) => void;
  onError: (message: string | null) => void;
  onPending: (value: boolean) => void;
};

function BoardColumn({
  status,
  cards,
  pending,
  onEdit,
  onError,
  onPending,
}: BoardColumnProps) {
  return (
    <section
      aria-labelledby={`column-${status}`}
      className="flex min-h-64 flex-col rounded-xl border border-zinc-200 bg-zinc-100/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <h2
        id={`column-${status}`}
        className="px-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        {CARD_STATUS_LABELS[status]}
        <span className="ml-2 font-normal text-zinc-500">{cards.length}</span>
      </h2>
      <ul className="mt-3 flex flex-1 flex-col gap-3">
        {cards.length === 0 ? (
          <li className="px-1 text-sm text-zinc-500">No cards</li>
        ) : (
          cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              pending={pending}
              onEdit={() => onEdit(card)}
              onError={onError}
              onPending={onPending}
            />
          ))
        )}
      </ul>
    </section>
  );
}

