import type { Card, CardStatus, Project } from "@/lib/types";

type ErrorBody = { error?: string };

/** Read `{ error }` from a failed API response. */
async function apiError(res: Response): Promise<Error> {
  try {
    const body = (await res.json()) as ErrorBody;
    if (typeof body.error === "string") return new Error(body.error);
  } catch {
    // ignore parse failures; fall through to status text
  }
  return new Error(`Request failed (${res.status})`);
}

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

/** POST /api/projects — create a project. */
export async function createProject(name: string): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw await apiError(res);
  const data = await readJson<{ project: Project }>(res);
  return data.project;
}

/** PATCH /api/projects/:id — rename a project. */
export async function updateProject(
  projectId: string,
  name: string,
): Promise<Project> {
  const res = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw await apiError(res);
  const data = await readJson<{ project: Project }>(res);
  return data.project;
}

/** DELETE /api/projects/:id — delete a project and its cards. */
export async function deleteProject(projectId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
  if (!res.ok) throw await apiError(res);
}

export type CreateCardInput = {
  title: string;
  description?: string;
  status?: CardStatus;
  dueDate?: string | null;
};

/** POST /api/projects/:id/cards — create a card. */
export async function createCard(
  projectId: string,
  input: CreateCardInput,
): Promise<Card> {
  const res = await fetch(`/api/projects/${projectId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await apiError(res);
  const data = await readJson<{ card: Card }>(res);
  return data.card;
}

export type CardPatch = {
  title?: string;
  description?: string;
  status?: CardStatus;
  order?: number;
  dueDate?: string | null;
};

/** PATCH /api/cards/:id — update card fields (including status and order). */
export async function updateCard(
  cardId: string,
  patch: CardPatch,
): Promise<Card> {
  const res = await fetch(`/api/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw await apiError(res);
  const data = await readJson<{ card: Card }>(res);
  return data.card;
}

/** DELETE /api/cards/:id — delete a card. */
export async function deleteCard(cardId: string): Promise<void> {
  const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
  if (!res.ok) throw await apiError(res);
}
