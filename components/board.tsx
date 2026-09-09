"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BoardColumn } from "@/components/board-column";
import { CardFormDialog } from "@/components/card-form-dialog";
import { updateCard, deleteProject, updateProject } from "@/lib/api-client";
import { groupCardsByStatus } from "@/lib/group-cards";
import { applyBoardDrag, type BoardDragResult } from "@/lib/move-card";
import type { Card, CardStatus, Project } from "@/lib/types";
import { CARD_STATUSES } from "@/lib/types";
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

/** Project board: @dnd-kit columns, mutations via existing CRUD APIs. */
export function Board({ project, cards: serverCards }: BoardProps) {
  const router = useRouter();
  const [cards, setCards] = useState(serverCards);
  const [dialog, setDialog] = useState<"create" | Card | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prevServerCards, setPrevServerCards] = useState(serverCards);
  if (serverCards !== prevServerCards) {
    setPrevServerCards(serverCards);
    setCards(serverCards);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columns = groupCardsByStatus(cards);
  const activeCard = activeId
    ? (cards.find((card) => card.id === activeId) ?? null)
    : null;
  const total = cards.length;
  const doneCount = columns.done.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  async function persistMove(result: BoardDragResult) {
    const snapshot = cards;
    setCards(result.cards);
    setError(null);
    setPending(true);
    try {
      await Promise.all(
        result.patches.map((patch) =>
          updateCard(patch.id, { status: patch.status, order: patch.order }),
        ),
      );
      router.refresh();
    } catch (err) {
      setCards(snapshot);
      setError(
        err instanceof Error ? err.message : "Could not save card position",
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  function applyAndPersist(activeId: string, overId: string) {
    const result = applyBoardDrag(cards, activeId, overId);
    if (result.patches.length === 0) return;
    void persistMove(result);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const overId = event.over ? String(event.over.id) : null;
    const draggedId = String(event.active.id);
    setActiveId(null);
    if (!overId) return;
    applyAndPersist(draggedId, overId);
  }

  function onDragCancel() {
    setActiveId(null);
  }

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

  function onStatusChange(card: Card, status: CardStatus) {
    applyAndPersist(card.id, status);
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
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {project.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="tabular-nums">
                  {total} card{total === 1 ? "" : "s"} · {doneCount} done ·{" "}
                  {percent}% complete
                </span>
              </div>
              <div
                className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                role="progressbar"
                aria-label="Board progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          )}
          <details className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            <summary className="cursor-pointer font-medium text-zinc-700 hover:underline dark:text-zinc-300">
              How to move cards
            </summary>
            <p className="mt-1">
              Drag the handle on a card to move it between columns or reorder
              within a column. Keyboard: focus the handle, Space to pick up,
              arrow keys to move, Space to drop, Escape to cancel. The{" "}
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                Status
              </strong>{" "}
              select is the accessible alternative to dragging between columns.
            </p>
          </details>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CARD_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              cards={columns[status]}
              pending={pending}
              onEdit={(item) => setDialog(item)}
              onError={setError}
              onPending={setPending}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="rotate-[1.5deg] scale-[1.02] rounded-xl border border-zinc-300 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    activeCard.status === "done"
                      ? "bg-emerald-500"
                      : activeCard.status === "in_progress"
                        ? "bg-blue-500"
                        : "bg-zinc-400"
                  }`}
                />
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {activeCard.title}
                </p>
              </div>
              {activeCard.description ? (
                <p className="mt-1 line-clamp-2 text-[13px] text-zinc-600 dark:text-zinc-400">
                  {activeCard.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
