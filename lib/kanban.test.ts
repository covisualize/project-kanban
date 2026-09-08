import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  CARD_STATUSES,
  DEMO_PROJECT_ID,
  KanbanError,
  KanbanStore,
} from "./kanban";

describe("KanbanStore happy-path CRUD", () => {
  let store: KanbanStore;

  beforeEach(() => {
    store = new KanbanStore(":memory:");
  });

  afterEach(() => {
    store.close();
  });

  it("creates, reads, updates, and deletes a project", () => {
    const created = store.createProject({ name: "  Alpha  " });
    assert.equal(created.name, "Alpha");
    assert.ok(created.id);
    assert.ok(created.createdAt);
    assert.ok(created.updatedAt);

    const listed = store.listProjects();
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.id, created.id);

    const read = store.getProject(created.id);
    assert.deepEqual(read, created);

    const updated = store.updateProject(created.id, { name: "Alpha renamed" });
    assert.equal(updated.name, "Alpha renamed");
    assert.equal(updated.id, created.id);
    assert.ok(updated.updatedAt >= created.updatedAt);

    store.deleteProject(created.id);
    assert.throws(() => store.getProject(created.id), (error: unknown) => {
      return error instanceof KanbanError && error.status === 404;
    });
    assert.deepEqual(store.listProjects(), []);
  });

  it("creates, reads, updates, and deletes a card on a project", () => {
    const project = store.createProject({ name: "Board" });

    const created = store.createCard(project.id, {
      title: "Write spec",
      description: "Happy-path CRUD",
      status: "todo",
      order: 0,
      dueDate: "2026-09-22",
    });
    assert.equal(created.projectId, project.id);
    assert.equal(created.title, "Write spec");
    assert.equal(created.description, "Happy-path CRUD");
    assert.equal(created.status, "todo");
    assert.equal(created.order, 0);
    assert.equal(created.dueDate, "2026-09-22");

    const listed = store.listCards(project.id);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.id, created.id);

    const read = store.getCard(created.id);
    assert.equal(read.title, "Write spec");

    const updated = store.updateCard(created.id, {
      title: "Write spec v2",
      status: "in_progress",
      order: 2,
      dueDate: null,
    });
    assert.equal(updated.title, "Write spec v2");
    assert.equal(updated.status, "in_progress");
    assert.equal(updated.order, 2);
    assert.equal(updated.dueDate, null);

    store.deleteCard(created.id);
    assert.throws(() => store.getCard(created.id), (error: unknown) => {
      return error instanceof KanbanError && error.status === 404;
    });
    assert.deepEqual(store.listCards(project.id), []);
  });

  it("cascades card deletes when a project is removed", () => {
    const project = store.createProject({ name: "Temp" });
    const card = store.createCard(project.id, { title: "Orphan me" });
    store.deleteProject(project.id);
    assert.throws(() => store.getCard(card.id), (error: unknown) => {
      return error instanceof KanbanError && error.status === 404;
    });
  });

  it("seeds one demo project with cards across columns", () => {
    store.ensureSeeded();
    const project = store.getProject(DEMO_PROJECT_ID);
    assert.equal(project.name, "Website relaunch");

    const cards = store.listCards(DEMO_PROJECT_ID);
    assert.ok(cards.length >= 3);
    const statuses = new Set(cards.map((card) => card.status));
    for (const status of CARD_STATUSES) {
      assert.ok(statuses.has(status), `missing column ${status}`);
    }

    store.ensureSeeded();
    assert.equal(store.listProjects().length, 1);
    assert.equal(store.listCards(DEMO_PROJECT_ID).length, cards.length);
  });

  it("assigns the next column order when order is omitted", () => {
    const project = store.createProject({ name: "Order" });
    const first = store.createCard(project.id, {
      title: "A",
      status: "todo",
    });
    const second = store.createCard(project.id, {
      title: "B",
      status: "todo",
    });
    assert.equal(first.order, 0);
    assert.equal(second.order, 1);
  });
});
