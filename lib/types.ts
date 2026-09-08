/** Kanban column / card status values. */
export const CARD_STATUSES = ["todo", "in_progress", "done"] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Card = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: CardStatus;
  order: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Human-readable labels for board columns and status selects. */
export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};
