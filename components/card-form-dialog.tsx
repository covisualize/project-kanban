"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCard, updateCard } from "@/lib/api-client";
import type { Card, CardStatus } from "@/lib/types";
import { CARD_STATUS_LABELS, CARD_STATUSES } from "@/lib/types";
import {
  btnPrimary,
  btnSecondary,
  errorClass,
  fieldClass,
  labelClass,
} from "@/lib/ui";

type CardFormDialogProps = {
  projectId: string;
  card: Card | null;
  onClose: () => void;
};

/** Create or edit a card through the existing cards API. */
export function CardFormDialog({
  projectId,
  card,
  onClose,
}: CardFormDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [status, setStatus] = useState<CardStatus>(card?.status ?? "todo");
  const [dueDate, setDueDate] = useState(card?.dueDate ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = card !== null;

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (!node.open) node.showModal();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const payload = {
      title,
      description,
      status,
      dueDate: dueDate.trim() === "" ? null : dueDate,
    };
    try {
      if (isEdit) {
        await updateCard(card.id, payload);
      } else {
        await createCard(projectId, payload);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save card");
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="card-form-title"
      className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-0 shadow-lg backdrop:bg-zinc-950/40 dark:border-zinc-800 dark:bg-zinc-900"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <h2
          id="card-form-title"
          className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
        >
          {isEdit ? "Edit card" : "New card"}
        </h2>

        <div>
          <label className={labelClass} htmlFor="card-title">
            Title
          </label>
          <input
            id="card-title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass}
            disabled={pending}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="card-description">
            Description
          </label>
          <textarea
            id="card-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={fieldClass}
            disabled={pending}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="card-status">
            Status
          </label>
          <select
            id="card-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as CardStatus)}
            className={fieldClass}
            disabled={pending}
          >
            {CARD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {CARD_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="card-due-date">
            Due date (optional)
          </label>
          <input
            id="card-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className={fieldClass}
            disabled={pending}
          />
        </div>

        {error ? <p className={errorClass}>{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={pending}>
            {isEdit ? "Save card" : "Create card"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
