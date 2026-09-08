# project-kanban

Kanban board to schedule and track projects.

This repository contains the **application shell**, a **persisted Project/Card API**, and a **kanban board UI** with drag-and-drop (columns, card CRUD, reorder). There is no authentication or calendar view yet.

## Prerequisites

- Node.js `>=22`
- npm 10+

## Install

```bash
npm install
```

## Seed demo data

Reset the local database to the demo project and cards (destructive):

```bash
npm run seed
```

This creates `Website relaunch` (`demo-project`) with cards in **To do**, **In progress**, and **Done**.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Where to click (board UI)

1. **Projects list** — `/` lists every project. After seed you should see **Website relaunch**.
2. **Create a project** — fill **Name** and click **Create project**. You land on the new board.
3. **Rename / delete a project** — on the list, click **Rename** or **Delete**. On a board, use **Rename project** / **Delete project**.
4. **Open a board** — click the project name or **Open**. Direct URL: [http://localhost:3000/projects/demo-project](http://localhost:3000/projects/demo-project).
5. **Columns and cards** — the board shows **To do**, **In progress**, and **Done** from each card's `status`.
6. **Create a card** — **New card**, fill the form (title, description, status, optional due date), **Create card**.
7. **Edit / delete a card** — **Edit** opens the same form; **Delete** confirms then removes it.
8. **Drag and drop** — grab the **six-dot handle** on a card. Drop on another card or on a column to move it. Order and status are saved with `PATCH /api/cards/:id`.
9. **Accessible alternative** — the **Status** select on each card (and in the edit form) still moves a card between columns without dragging. Keyboard drag: focus the handle, **Space** to pick up, **arrow keys** to move, **Space** to drop, **Escape** to cancel.

### How to test drag-and-drop persistence

1. Reset demo data: `npm run seed`
2. Start the app: `npm run dev`
3. Open [http://localhost:3000/projects/demo-project](http://localhost:3000/projects/demo-project)
4. **Reorder within a column:** In **To do**, drag **Choose color palette** above **Draft homepage copy**. Palette should be first.
5. **Move between columns:** Drag **Draft homepage copy** onto **Build landing hero** in **In progress**. Homepage should sit above the hero; **To do** should only have the palette.
6. Refresh the page. The same positions should remain (palette in To do; homepage then hero in In progress).
7. Optional API check:

```bash
curl -s http://localhost:3000/api/projects/demo-project
```

Confirm `demo-card-todo-2` is still `todo` with `"order": 0`, and `demo-card-todo-1` is `in_progress` with `"order": 0` (`demo-card-doing-1` at `"order": 1`).

8. **Without a mouse:** change a card's **Status** select — that is the keyboard/accessible path and also persists.

Health check (JSON `{ "status": "ok" }`):

[http://localhost:3000/api/health](http://localhost:3000/api/health)

On first API or page load, a local SQLite file is created at `data/kanban.sqlite` and seeded with the demo project if the file is new.

## API

Contracts live in [`specs/kanban-api.md`](specs/kanban-api.md). With the dev server running:

```bash
# List projects (includes the seeded demo after first run / seed)
curl http://localhost:3000/api/projects

# Read demo project + cards
curl http://localhost:3000/api/projects/demo-project

# Create a project
curl -s -X POST http://localhost:3000/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sprint board"}'

# Update a project
curl -s -X PATCH http://localhost:3000/api/projects/demo-project \
  -H 'Content-Type: application/json' \
  -d '{"name":"Website relaunch (renamed)"}'

# Create a card
curl -s -X POST http://localhost:3000/api/projects/demo-project/cards \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write release notes","status":"todo","dueDate":"2026-09-30"}'

# Read / update / delete a card (replace CARD_ID)
curl http://localhost:3000/api/cards/demo-card-todo-1

curl -s -X PATCH http://localhost:3000/api/cards/demo-card-todo-1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress","order":1}'

curl -s -X DELETE http://localhost:3000/api/cards/CARD_ID

# Delete a project (cascades cards)
curl -s -X DELETE http://localhost:3000/api/projects/PROJECT_ID
```

Demo card ids after seed: `demo-card-todo-1`, `demo-card-todo-2`, `demo-card-doing-1`, `demo-card-done-1`.

## Tests

```bash
npm test
```

## Production build

```bash
npm run build
npm start
```

Then open the same URLs as above (default port 3000).

## Lint

```bash
npm run lint
```

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Persistence | Local SQLite (`better-sqlite3`, file `data/kanban.sqlite`) |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` |
| Auth | None (intentional for this stage) |
