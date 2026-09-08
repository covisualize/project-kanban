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

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`column-${status}`}
      className={`flex min-h-64 flex-col rounded-xl border p-3 ${
        isOver
          ? "border-zinc-400 bg-zinc-200/80 dark:border-zinc-500 dark:bg-zinc-800/80"
          : "border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      <h2
        id={`column-${status}`}
        className="px-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200"
      >
        {CARD_STATUS_LABELS[status]}
        <span className="ml-2 font-normal text-zinc-500">{cards.length}</span>
      </h2>
      <SortableContext
        items={cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="mt-3 flex flex-1 flex-col gap-3">
          {cards.length === 0 ? (
            <li className="px-1 text-sm text-zinc-500">No cards</li>
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
