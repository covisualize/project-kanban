"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCardItem } from "@/components/card-item";
import type { Card, CardStatus } from "@/lib/types";
import { CARD_STATUS_LABELS } from "@/lib/types";

type BoardColumnProps = {
  status: CardStatus;
  cards: Card[];
  pending: boolean;
  onEdit: (card: Card) => void;
  onError: (message: string | null) => void;
  onPending: (value: boolean) => void;
  onStatusChange: (card: Card, status: CardStatus) => void;
};

const COLUMN_ACCENT: Record<
  CardStatus,
  { dot: string; sub: string; activeRing: string }
> = {
  todo: {
    dot: "bg-zinc-400",
    sub: "Needs doing",
    activeRing: "ring-zinc-300 dark:ring-zinc-600",
  },
  in_progress: {
    dot: "bg-blue-500",
    sub: "In motion",
    activeRing: "ring-blue-300 dark:ring-blue-700",
  },
  done: {
    dot: "bg-emerald-500",
    sub: "Shipped",
    activeRing: "ring-emerald-300 dark:ring-emerald-700",
  },
};

/** One status column: droppable surface plus a sortable card list. */
export function BoardColumn({
  status,
  cards,
  pending,
  onEdit,
  onError,
  onPending,
  onStatusChange,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const accent = COLUMN_ACCENT[status];

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`column-${status}`}
      className={`flex min-h-64 flex-col rounded-2xl border p-3 shadow-sm transition-shadow ${
        isOver
          ? `border-transparent bg-white ring-2 ${accent.activeRing} dark:bg-zinc-900`
          : "border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-baseline gap-2 px-1">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 self-center rounded-full ${accent.dot}`}
        />
        <h2
          id={`column-${status}`}
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          {CARD_STATUS_LABELS[status]}
        </h2>
        <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-600 tabular-nums dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {cards.length}
        </span>
        <span className="ml-auto hidden text-xs text-zinc-400 lg:inline dark:text-zinc-500">
          {accent.sub}
        </span>
      </div>
      <SortableContext
        items={cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="mt-3 flex flex-1 flex-col gap-3">
          {cards.length === 0 ? (
            <li
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-8 text-center ${
                isOver
                  ? "border-blue-300 bg-blue-50/60 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-zinc-300 bg-white/50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400"
              }`}
            >
              <p className="text-sm font-medium">
                {isOver ? "Drop here" : "No cards yet"}
              </p>
              <p className="text-xs">
                Drag a card here or change its Status
              </p>
            </li>
          ) : (
            cards.map((card) => (
              <SortableCardItem
                key={card.id}
                card={card}
                pending={pending}
                onEdit={() => onEdit(card)}
                onError={onError}
                onPending={onPending}
                onStatusChange={(status) => onStatusChange(card, status)}
              />
            ))
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
