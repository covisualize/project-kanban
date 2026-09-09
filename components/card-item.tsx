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

const STATUS_DOT: Record<CardStatus, string> = {
  todo: "bg-zinc-400",
  in_progress: "bg-blue-500",
  done: "bg-emerald-500",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDueDate(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Short human label plus urgency tone for the due-date pill. */
function dueMeta(
  dueDate: string | null,
  status: CardStatus,
): { label: string; className: string } | null {
  if (!dueDate) return null;
  const due = parseDueDate(dueDate);
  if (!due) return { label: `Due ${dueDate}`, className: duePill("later") };
  const label = `Due ${MONTHS[due.getMonth()]} ${due.getDate()}`;
  if (status === "done") {
    return { label, className: duePill("done") };
  }
  const diffDays = Math.round(
    (due.getTime() - startOfToday().getTime()) / 86_400_000,
  );
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: `${label} · ${days} day${days === 1 ? "" : "s"} overdue`,
      className: duePill("overdue"),
    };
  }
  if (diffDays === 0) {
    return { label: `${label} · today`, className: duePill("today") };
  }
  if (diffDays <= 3) {
    return {
      label: `${label} · in ${diffDays}d`,
      className: duePill("soon"),
    };
  }
  return { label, className: duePill("later") };
}

function duePill(
  tone: "overdue" | "today" | "soon" | "later" | "done",
): string {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium";
  switch (tone) {
    case "overdue":
      return `${base} border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300`;
    case "today":
      return `${base} border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300`;
    case "soon":
      return `${base} border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300`;
    case "done":
      return `${base} border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400`;
    case "later":
    default:
      return `${base} border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400`;
  }
}

/** One board card: drag handle, details, status select, edit, and delete. */
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
  const due = dueMeta(card.dueDate, card.status);

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
      className={`group rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 ${
        isDragging ? "opacity-40 ring-2 ring-zinc-300 dark:ring-zinc-600" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {showHandle ? (
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-400 touch-none hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label={`Drag to move ${card.title}`}
            title="Drag to move"
            disabled={pending}
            {...dragHandleProps}
          >
            <GripIcon />
          </button>
        ) : null}
        <span
          aria-hidden="true"
          title={CARD_STATUS_LABELS[card.status]}
          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[card.status]}`}
        />
        <span className="ml-auto shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 tabular-nums dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          #{card.order + 1}
        </span>
      </div>
      <h3 className="mt-1.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {card.title}
      </h3>
      {card.description ? (
        <p className="mt-1 line-clamp-3 text-[13px] leading-5 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {card.description}
        </p>
      ) : null}
      {due ? (
        <p className="mt-2">
          <span className={due.className}>{due.label}</span>
        </p>
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
