import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

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

export const DEMO_PROJECT_ID = "demo-project";

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type CardRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  sort_order: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

/** Domain error with an HTTP status for API mapping. */
export class KanbanError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "KanbanError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCard(row: CardRow): Card {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status as CardStatus,
    order: row.sort_order,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseRequiredName(input: unknown): string {
  if (!isRecord(input) || typeof input.name !== "string") {
    throw new KanbanError(400, "name is required");
  }
  const name = input.name.trim();
  if (!name) {
    throw new KanbanError(400, "name is required");
  }
  return name;
}

function parseOptionalName(input: Record<string, unknown>): string | undefined {
  if (!("name" in input)) return undefined;
  if (typeof input.name !== "string") {
    throw new KanbanError(400, "name must be a string");
  }
  const name = input.name.trim();
  if (!name) {
    throw new KanbanError(400, "name is required");
  }
  return name;
}

function parseStatus(value: unknown): CardStatus {
  if (typeof value !== "string" || !CARD_STATUSES.includes(value as CardStatus)) {
    throw new KanbanError(
      400,
      `status must be one of: ${CARD_STATUSES.join(", ")}`,
    );
  }
  return value as CardStatus;
}

function parseOrder(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new KanbanError(400, "order must be a non-negative integer");
  }
  return value;
}

function parseDueDate(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new KanbanError(400, "dueDate must be YYYY-MM-DD or null");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new KanbanError(400, "dueDate must be a valid calendar date");
  }
  return value;
}

function parseCreateCardInput(input: unknown): {
  title: string;
  description: string;
  status: CardStatus;
  order?: number;
  dueDate: string | null;
} {
  if (!isRecord(input) || typeof input.title !== "string") {
    throw new KanbanError(400, "title is required");
  }
  const title = input.title.trim();
  if (!title) {
    throw new KanbanError(400, "title is required");
  }
  const description =
    input.description === undefined
      ? ""
      : typeof input.description === "string"
        ? input.description
        : (() => {
            throw new KanbanError(400, "description must be a string");
          })();
  const status =
    input.status === undefined ? "todo" : parseStatus(input.status);
  const order = input.order === undefined ? undefined : parseOrder(input.order);
  const dueDate =
    input.dueDate === undefined ? null : parseDueDate(input.dueDate);
  return { title, description, status, order, dueDate };
}

function parseUpdateCardInput(input: unknown): {
  title?: string;
  description?: string;
  status?: CardStatus;
  order?: number;
  dueDate?: string | null;
} {
  if (!isRecord(input)) {
    throw new KanbanError(400, "JSON object body required");
  }
  const patch: {
    title?: string;
    description?: string;
    status?: CardStatus;
    order?: number;
    dueDate?: string | null;
  } = {};
  if ("title" in input) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw new KanbanError(400, "title is required");
    }
    patch.title = input.title.trim();
  }
  if ("description" in input) {
    if (typeof input.description !== "string") {
      throw new KanbanError(400, "description must be a string");
    }
    patch.description = input.description;
  }
  if ("status" in input) {
    patch.status = parseStatus(input.status);
  }
  if ("order" in input) {
    patch.order = parseOrder(input.order);
  }
  if ("dueDate" in input) {
    patch.dueDate = parseDueDate(input.dueDate);
  }
  return patch;
}

/** File-backed SQLite store for Project and Card CRUD. */
export class KanbanStore {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ":memory:") {
      mkdirSync(dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    if (dbPath !== ":memory:") {
      this.db.pragma("journal_mode = WAL");
    }
    this.migrate();
  }

  /** Close the underlying SQLite connection. */
  close(): void {
    this.db.close();
  }

  /** Create tables if they do not exist. */
  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
        sort_order INTEGER NOT NULL,
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_cards_project
        ON cards (project_id, status, sort_order);
    `);
  }

  /**
   * Insert demo data once on a fresh database.
   * Does not re-seed after the user deletes all rows.
   */
  ensureSeeded(): void {
    const row = this.db
      .prepare("SELECT value FROM meta WHERE key = 'seeded'")
      .get() as { value: string } | undefined;
    if (row) return;
    this.insertDemo();
    this.db
      .prepare("INSERT INTO meta (key, value) VALUES ('seeded', '1')")
      .run();
  }

  /** Wipe domain tables and restore demo project + cards. */
  resetDemo(): void {
    const tx = this.db.transaction(() => {
      this.db.exec("DELETE FROM cards; DELETE FROM projects;");
      this.insertDemo();
      this.db
        .prepare(
          "INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')",
        )
        .run();
    });
    tx();
  }

  /** Return all projects, oldest first. */
  listProjects(): Project[] {
    const rows = this.db
      .prepare(
        "SELECT id, name, created_at, updated_at FROM projects ORDER BY created_at ASC, id ASC",
      )
      .all() as ProjectRow[];
    return rows.map(mapProject);
  }

  /** Return one project or throw 404. */
  getProject(id: string): Project {
    const row = this.db
      .prepare(
        "SELECT id, name, created_at, updated_at FROM projects WHERE id = ?",
      )
      .get(id) as ProjectRow | undefined;
    if (!row) {
      throw new KanbanError(404, "project not found");
    }
    return mapProject(row);
  }

  /** Create a project from `{ name }`. */
  createProject(input: unknown): Project {
    const name = parseRequiredName(input);
    const id = crypto.randomUUID();
    const ts = nowIso();
    this.db
      .prepare(
        "INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      )
      .run(id, name, ts, ts);
    return this.getProject(id);
  }

  /** Patch a project. Currently supports `{ name }`. */
  updateProject(id: string, input: unknown): Project {
    this.getProject(id);
    if (!isRecord(input)) {
      throw new KanbanError(400, "JSON object body required");
    }
    const name = parseOptionalName(input);
    if (name === undefined) {
      return this.getProject(id);
    }
    this.db
      .prepare("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?")
      .run(name, nowIso(), id);
    return this.getProject(id);
  }

  /** Delete a project and cascade its cards. */
  deleteProject(id: string): void {
    this.getProject(id);
    this.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  }

  /** Return cards for a project, grouped by column then order. */
  listCards(projectId: string): Card[] {
    this.getProject(projectId);
    const rows = this.db
      .prepare(
        `SELECT id, project_id, title, description, status, sort_order, due_date, created_at, updated_at
         FROM cards
         WHERE project_id = ?
         ORDER BY CASE status
           WHEN 'todo' THEN 0
           WHEN 'in_progress' THEN 1
           WHEN 'done' THEN 2
         END, sort_order ASC, id ASC`,
      )
      .all(projectId) as CardRow[];
    return rows.map(mapCard);
  }

  /** Return one card or throw 404. */
  getCard(id: string): Card {
    const row = this.db
      .prepare(
        `SELECT id, project_id, title, description, status, sort_order, due_date, created_at, updated_at
         FROM cards WHERE id = ?`,
      )
      .get(id) as CardRow | undefined;
    if (!row) {
      throw new KanbanError(404, "card not found");
    }
    return mapCard(row);
  }

  /** Create a card on a project. */
  createCard(projectId: string, input: unknown): Card {
    this.getProject(projectId);
    const parsed = parseCreateCardInput(input);
    const id = crypto.randomUUID();
    const ts = nowIso();
    const order =
      parsed.order ??
      (
        this.db
          .prepare(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM cards WHERE project_id = ? AND status = ?",
          )
          .get(projectId, parsed.status) as { next: number }
      ).next;
    this.db
      .prepare(
        `INSERT INTO cards
          (id, project_id, title, description, status, sort_order, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        projectId,
        parsed.title,
        parsed.description,
        parsed.status,
        order,
        parsed.dueDate,
        ts,
        ts,
      );
    return this.getCard(id);
  }

  /** Patch card fields (`title`, `description`, `status`, `order`, `dueDate`). */
  updateCard(id: string, input: unknown): Card {
    const existing = this.getCard(id);
    const patch = parseUpdateCardInput(input);
    const title = patch.title ?? existing.title;
    const description = patch.description ?? existing.description;
    const status = patch.status ?? existing.status;
    const order = patch.order ?? existing.order;
    const dueDate = patch.dueDate === undefined ? existing.dueDate : patch.dueDate;
    this.db
      .prepare(
        `UPDATE cards
         SET title = ?, description = ?, status = ?, sort_order = ?, due_date = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(title, description, status, order, dueDate, nowIso(), id);
    return this.getCard(id);
  }

  /** Delete one card. */
  deleteCard(id: string): void {
    this.getCard(id);
    this.db.prepare("DELETE FROM cards WHERE id = ?").run(id);
  }

  private insertDemo(): void {
    const ts = nowIso();
    this.db
      .prepare(
        "INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      )
      .run(DEMO_PROJECT_ID, "Website relaunch", ts, ts);

    const cards: Array<{
      id: string;
      title: string;
      description: string;
      status: CardStatus;
      order: number;
      dueDate: string | null;
    }> = [
      {
        id: "demo-card-done-1",
        title: "Kickoff meeting notes",
        description: "Capture goals, audience, and success metrics.",
        status: "done",
        order: 0,
        dueDate: null,
      },
      {
        id: "demo-card-todo-1",
        title: "Draft homepage copy",
        description: "Hero, features, and CTA text for the new site.",
        status: "todo",
        order: 0,
        dueDate: "2026-09-15",
      },
      {
        id: "demo-card-todo-2",
        title: "Choose color palette",
        description: "Primary, accent, and neutral tokens.",
        status: "todo",
        order: 1,
        dueDate: null,
      },
      {
        id: "demo-card-doing-1",
        title: "Build landing hero",
        description: "Responsive hero layout with CTA.",
        status: "in_progress",
        order: 0,
        dueDate: "2026-09-20",
      },
    ];

    const insert = this.db.prepare(
      `INSERT INTO cards
        (id, project_id, title, description, status, sort_order, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const card of cards) {
      insert.run(
        card.id,
        DEMO_PROJECT_ID,
        card.title,
        card.description,
        card.status,
        card.order,
        card.dueDate,
        ts,
        ts,
      );
    }
  }
}

const defaultDbPath = join(process.cwd(), "data", "kanban.sqlite");

let defaultStore: KanbanStore | undefined;

/** Process-wide store used by App Router handlers. Seeds once on first open. */
export function getStore(): KanbanStore {
  if (!defaultStore) {
    defaultStore = new KanbanStore(
      process.env.KANBAN_DB_PATH ?? defaultDbPath,
    );
    defaultStore.ensureSeeded();
  }
  return defaultStore;
}
