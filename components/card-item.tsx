"use client";

import { useRouter } from "next/navigation";
import { deleteCard, updateCard } from "@/lib/api-client";
import type { Card, CardStatus } from "@/lib/types";
import { CARD_STATUS_LABELS, CARD_STATUSES } from "@/lib/types";
import { btnDanger, btnSecondary, fieldClass, labelClass } from "@/lib/ui";

type CardItemProps = {
  card: Card;
  pending: boolean;
  onEdit: () => void;
  onError: (message: string | null) => void;
  onPending: (value: boolean) => void;
};

/** One board card: status select, edit, and delete (no drag-and-drop). */
export function CardItem({
  card,
  pending,
  onEdit,
  onError,
  onPending,
}: CardItemProps) {
  const router = useRouter();

  async function onStatusChange(status: CardStatus) {
    if (status === card.status) return;
    onError(null);
    onPending(true);
    try {
      await updateCard(card.id, { status });
      router.refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      onPending(false);
    }
  }

  async function onDelete() {
    const ok = window.confirm(`Delete card “${card.title}”?`);
    if (!ok) return;
    onError(null);
    onPending(true);
    try {
      await deleteCard(card.id);
      router.refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete card");
    } finally {
      onPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {card.title}
      </h3>
      {card.description ? (
        <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {card.description}
        </p>
      ) : null}
      {card.dueDate ? (
        <p className="mt-2 text-xs text-zinc-500">Due {card.dueDate}</p>
      ) : null}
      <label className={`${labelClass} mt-3`} htmlFor={`status-${card.id}`}>
        Status
      </label>
      <select
        id={`status-${card.id}`}
        aria-label={`Status for ${card.title}`}
        value={card.status}
        disabled={pending}
        className={fieldClass}
        onChange={(event) => onStatusChange(event.target.value as CardStatus)}
      >
        {CARD_STATUSES.map((value) => (
          <option key={value} value={value}>
            {CARD_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={btnSecondary}
          disabled={pending}
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className={btnDanger}
          disabled={pending}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
