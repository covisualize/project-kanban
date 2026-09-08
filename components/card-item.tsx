"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import type { CSSProperties, HTMLAttributes } from "react";
import { deleteCard } from "@/lib/api-client";
import type { Card, CardStatus } from "@/lib/types";
import { CARD_STATUS_LABELS, CARD_STATUSES } from "@/lib/types";
import { btnDanger, btnSecondary, fieldClass, labelClass } from "@/lib/ui";

type CardItemProps = {
  card: Card;
  pending: boolean;
  onEdit: () => void;
  onError: (message: string | null) => void;
  onPending: (value: boolean) => void;
  onStatusChange: (status: CardStatus) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  isDragging?: boolean;
  showHandle?: boolean;
};

/** One board card: drag handle, status select, edit, and delete. */
export function CardItem({
  card,
  pending,
  onEdit,
  onError,
  onPending,
  onStatusChange,
  dragHandleProps,
  setNodeRef,
  style,
  isDragging = false,
  showHandle = true,
}: CardItemProps) {
  const router = useRouter();

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
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${isDragging ? "opacity-40" : ""}`}
    >
      {showHandle ? (
        <button
          type="button"
          className="mb-2 inline-flex h-7 w-7 cursor-grab items-center justify-center rounded text-zinc-400 touch-none hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label={`Drag to move ${card.title}`}
          title="Drag to move"
          disabled={pending}
          {...dragHandleProps}
        >
          <GripIcon />
        </button>
      ) : null}
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

type SortableCardItemProps = Omit<
  CardItemProps,
  "dragHandleProps" | "setNodeRef" | "style" | "isDragging" | "showHandle"
>;

/** Card wrapped with @dnd-kit/sortable for column lists. */
export function SortableCardItem(props: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.card.id, disabled: props.pending });

  return (
    <CardItem
      {...props}
      setNodeRef={setNodeRef}
      isDragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      dragHandleProps={
        { ...attributes, ...listeners } as HTMLAttributes<HTMLButtonElement>
      }
    />
  );
}

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 fill-current"
    >
      <circle cx="6" cy="3" r="1.25" />
      <circle cx="10" cy="3" r="1.25" />
      <circle cx="6" cy="8" r="1.25" />
      <circle cx="10" cy="8" r="1.25" />
      <circle cx="6" cy="13" r="1.25" />
      <circle cx="10" cy="13" r="1.25" />
    </svg>
  );
}
