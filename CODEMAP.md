# CODEMAP

- `app/layout.tsx` — root HTML layout, fonts, metadata
- `app/page.tsx` — home page shell
- `app/api/health/route.ts` — `GET` JSON liveness (`{ status: "ok" }`)
- `app/api/projects/route.ts` — list/create projects
- `app/api/projects/[projectId]/route.ts` — get/update/delete project
- `app/api/projects/[projectId]/cards/route.ts` — list/create cards on a project
- `app/api/cards/[cardId]/route.ts` — get/update/delete card
- `app/globals.css` — Tailwind v4 entry
- `lib/kanban.ts` — Project/Card types, SQLite store, seed
- `lib/http.ts` — JSON body parse + KanbanError HTTP mapping
- `lib/kanban.test.ts` — happy-path CRUD tests (`npm test`)
- `scripts/seed.ts` — reset local DB to demo data (`npm run seed`)
- `specs/kanban-api.md` — HTTP contracts
- `next.config.ts` — Next.js config (`serverExternalPackages` for better-sqlite3)
