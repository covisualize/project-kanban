# Kanban API contracts (task 2)

Local SQLite persistence. No auth. JSON request/response bodies.

## Types

```ts
type CardStatus = "todo" | "in_progress" | "done";

type Project = {
  id: string;
  name: string;
  createdAt: string; // ISO-8601
  updatedAt: string;
};

type Card = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: CardStatus;
  order: number; // position within a column
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
};

type ErrorBody = { error: string };
```

## Projects

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/projects` | — | `{ projects: Project[] }` |
| POST | `/api/projects` | `{ name: string }` | `201 { project: Project }` |
| GET | `/api/projects/:projectId` | — | `{ project: Project, cards: Card[] }` |
| PATCH | `/api/projects/:projectId` | `{ name?: string }` | `{ project: Project }` |
| DELETE | `/api/projects/:projectId` | — | `{ ok: true }` |

Deleting a project also deletes its cards.

## Cards

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/projects/:projectId/cards` | — | `{ cards: Card[] }` |
| POST | `/api/projects/:projectId/cards` | `{ title, description?, status?, order?, dueDate? }` | `201 { card: Card }` |
| GET | `/api/cards/:cardId` | — | `{ card: Card }` |
| PATCH | `/api/cards/:cardId` | any subset of card fields | `{ card: Card }` |
| DELETE | `/api/cards/:cardId` | — | `{ ok: true }` |

- `status` defaults to `"todo"`.
- `order` defaults to the next index in that project column.
- `dueDate` is `YYYY-MM-DD` or `null`. PATCH with `"dueDate": null` clears it.
- Missing project or card → `404 { error }`.
- Invalid body → `400 { error }`.
