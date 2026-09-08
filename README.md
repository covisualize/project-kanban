# project-kanban

Kanban board to schedule and track projects.

This repository currently contains the **application shell** plus a **persisted Project/Card API**. There is no authentication and no board UI yet.

## Prerequisites

- Node.js `>=20.9.0`
- npm 10+

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The home page should render the `project-kanban` shell.

Health check (JSON `{ "status": "ok" }`):

[http://localhost:3000/api/health](http://localhost:3000/api/health)

On first API request, a local SQLite file is created at `data/kanban.sqlite` and seeded with one demo project (`demo-project`) and cards across `todo`, `in_progress`, and `done`.

## Seed

Reset the local database to the demo project and cards (destructive):

```bash
npm run seed
```

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
| Auth | None (intentional for this stage) |
