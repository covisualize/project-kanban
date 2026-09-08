# project-kanban

Kanban board to schedule and track projects.

This repository currently contains the **application shell only**: Next.js (App Router), TypeScript, and Tailwind CSS. There is no authentication and no board UI yet.

## Prerequisites

- Node.js 20+ (Node 22 is fine)
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
| Auth | None (intentional for this scaffold) |
