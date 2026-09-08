import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { DEMO_PROJECT_ID, KanbanStore } from "./kanban";
import { applyBoardDrag } from "./move-card";
import type { Card, CardStatus } from "./types";

function card(id: string, status: CardStatus, order: number): Card {
  return {
    id,
    projectId: "p1",
    title: id,
    description: "",
    status,
    order,
    dueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function ids(cards: Card[], status: CardStatus): string[] {
  return cards.filter((item) => item.status === status).map((item) => item.id);
}

function orders(cards: Card[], status: CardStatus): number[] {
  return cards.filter((item) => item.status === status).map((item) => item.order);
}

describe("applyBoardDrag", () => {
  const seed = [
    card("t1", "todo", 0),
    card("t2", "todo", 1),
    card("d1", "in_progress", 0),
    card("n1", "done", 0),
  ];

  it("reorders within a column using arrayMove", () => {
    const { cards, patches } = applyBoardDrag(seed, "t1", "t2");
    assert.deepEqual(ids(cards, "todo"), ["t2", "t1"]);
    assert.deepEqual(orders(cards, "todo"), [0, 1]);
    assert.deepEqual(
      patches.map((patch) => [patch.id, patch.order]),
      [
        ["t2", 0],
        ["t1", 1],
      ],
    );
  });

  it("inserts a card before the hovered card in another column", () => {
    const { cards, patches } = applyBoardDrag(seed, "t1", "d1");
    assert.deepEqual(ids(cards, "todo"), ["t2"]);
    assert.deepEqual(orders(cards, "todo"), [0]);
    assert.deepEqual(ids(cards, "in_progress"), ["t1", "d1"]);
    assert.deepEqual(orders(cards, "in_progress"), [0, 1]);
    const t1 = patches.find((patch) => patch.id === "t1");
    assert.equal(t1?.status, "in_progress");
    assert.equal(t1?.order, 0);
  });

  it("appends when dropped on a column id", () => {
    const { cards } = applyBoardDrag(seed, "t1", "in_progress");
    assert.deepEqual(ids(cards, "todo"), ["t2"]);
    assert.deepEqual(ids(cards, "in_progress"), ["d1", "t1"]);
  });

  it("moves a card into an empty column", () => {
    const onlyTodo = [card("t1", "todo", 0)];
    const { cards, patches } = applyBoardDrag(onlyTodo, "t1", "done");
    assert.deepEqual(ids(cards, "todo"), []);
    assert.deepEqual(ids(cards, "done"), ["t1"]);
    assert.deepEqual(patches, [{ id: "t1", status: "done", order: 0 }]);
  });

  it("is a no-op when dropped on itself or the same column chrome", () => {
    assert.deepEqual(applyBoardDrag(seed, "t1", "t1").patches, []);
    assert.deepEqual(applyBoardDrag(seed, "t1", "todo").patches, []);
    assert.deepEqual(applyBoardDrag(seed, "missing", "done").patches, []);
  });
});

describe("applyBoardDrag + KanbanStore PATCH", () => {
  let store: KanbanStore;

  beforeEach(() => {
    store = new KanbanStore(":memory:");
    store.resetDemo();
  });

  afterEach(() => {
    store.close();
  });

  it("persists status and order so a reload matches the drag result", () => {
    const before = store.listCards(DEMO_PROJECT_ID);
    const result = applyBoardDrag(before, "demo-card-todo-1", "demo-card-doing-1");
    for (const patch of result.patches) {
      store.updateCard(patch.id, { status: patch.status, order: patch.order });
    }
    const reloaded = store.listCards(DEMO_PROJECT_ID);
    for (const card of result.cards) {
      const row = reloaded.find((item) => item.id === card.id);
      assert.equal(row?.status, card.status);
      assert.equal(row?.order, card.order);
    }
  });
});
