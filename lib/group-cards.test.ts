import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupCardsByStatus } from "./group-cards";
import type { Card } from "./types";

function card(partial: Pick<Card, "id" | "status">): Card {
  return {
    projectId: "p1",
    title: partial.id,
    description: "",
    order: 0,
    dueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("groupCardsByStatus", () => {
  it("buckets cards by existing status/column values", () => {
    const grouped = groupCardsByStatus([
      card({ id: "done-1", status: "done" }),
      card({ id: "todo-1", status: "todo" }),
      card({ id: "doing-1", status: "in_progress" }),
      card({ id: "todo-2", status: "todo" }),
    ]);
    assert.deepEqual(
      grouped.todo.map((item) => item.id),
      ["todo-1", "todo-2"],
    );
    assert.deepEqual(
      grouped.in_progress.map((item) => item.id),
      ["doing-1"],
    );
    assert.deepEqual(
      grouped.done.map((item) => item.id),
      ["done-1"],
    );
  });

  it("returns empty columns when there are no cards", () => {
    assert.deepEqual(groupCardsByStatus([]), {
      todo: [],
      in_progress: [],
      done: [],
    });
  });
});
